import type { DerivedTiming, EffectiveStatus, Session, SessionWithTiming } from './types'

const TOLERANCE_MS = 30 * 1000 // 종료 시각 비교 시 30초 여유(시계 오차/클릭 지연 흡수)

/**
 * 세션의 시간 기반 파생 값(잔여/초과/조기종료/진행중 여부)을 매 호출마다 재계산한다.
 * status는 운영자가 명시적으로 설정한 값을 그대로 신뢰하되, 시각 비교가 필요한
 * live→overtime, ended→ended_early/overtime 전환은 여기서 파생해 effective_status로 노출한다.
 * (저장값을 매 틱 덮어쓰지 않기 위함)
 */
export function deriveTiming(s: Session, now: Date): DerivedTiming {
  const startMs = s.planned_start_at ? new Date(s.planned_start_at).getTime() : null
  const endMs = s.planned_end_at ? new Date(s.planned_end_at).getTime() : null
  const nowMs = now.getTime()
  const slideProgressPct =
    s.total_slides > 0 ? Math.min(100, Math.round((s.current_slide / s.total_slides) * 100)) : 0

  if (s.status === 'cancelled') {
    return {
      elapsed_minutes: null,
      remaining_minutes: null,
      overtime_minutes: 0,
      early_finish_minutes: 0,
      effective_status: 'cancelled',
      slide_progress_pct: slideProgressPct,
    }
  }

  // 종료된 세션: 실제 종료 시각과 예정 종료 시각을 비교해 정시/조기/초과 종료를 구분
  if (s.completed_at) {
    const actualEndMs = new Date(s.completed_at).getTime()
    const startRef = s.started_at ? new Date(s.started_at).getTime() : startMs ?? actualEndMs
    const elapsed = Math.max(0, Math.round((actualEndMs - startRef) / 60000))

    let overtime = 0
    let earlyFinish = 0
    let effective: EffectiveStatus

    if (endMs === null) {
      effective = s.issue_note ? 'issue' : 'ended'
    } else if (actualEndMs < endMs - TOLERANCE_MS) {
      earlyFinish = Math.round((endMs - actualEndMs) / 60000)
      effective = s.issue_note ? 'issue' : 'ended_early'
    } else if (actualEndMs > endMs + TOLERANCE_MS) {
      overtime = Math.round((actualEndMs - endMs) / 60000)
      effective = s.issue_note ? 'issue' : 'overtime'
    } else {
      effective = s.issue_note ? 'issue' : 'ended'
    }

    return {
      elapsed_minutes: elapsed,
      remaining_minutes: 0,
      overtime_minutes: overtime,
      early_finish_minutes: earlyFinish,
      effective_status: effective,
      slide_progress_pct: slideProgressPct,
    }
  }

  // 진행 중인 세션: 남은 시간/초과 시간을 현재 시각 기준으로 계산
  if (s.started_at) {
    const startRef = new Date(s.started_at).getTime()
    const elapsed = Math.max(0, Math.round((nowMs - startRef) / 60000))
    let remaining = endMs !== null ? Math.round((endMs - nowMs) / 60000) : null
    let overtime = 0

    if (endMs !== null && nowMs > endMs + TOLERANCE_MS) {
      overtime = Math.round((nowMs - endMs) / 60000)
      remaining = 0
    } else if (remaining !== null && remaining < 0) {
      remaining = 0
    }

    let effective: EffectiveStatus
    if (s.status === 'paused') {
      effective = 'paused'
    } else if (s.issue_note) {
      effective = 'issue'
    } else if (overtime > 0) {
      effective = 'overtime'
    } else {
      effective = 'live'
    }

    return {
      elapsed_minutes: elapsed,
      remaining_minutes: remaining,
      overtime_minutes: overtime,
      early_finish_minutes: 0,
      effective_status: effective,
      slide_progress_pct: slideProgressPct,
    }
  }

  // 아직 시작하지 않은 세션
  const allocated = startMs !== null && endMs !== null ? Math.round((endMs - startMs) / 60000) : null
  const effective: EffectiveStatus = s.issue_note ? 'issue' : s.status === 'ready' ? 'ready' : 'scheduled'
  return {
    elapsed_minutes: null,
    remaining_minutes: allocated,
    overtime_minutes: 0,
    early_finish_minutes: 0,
    effective_status: effective,
    slide_progress_pct: slideProgressPct,
  }
}

export function withTiming(sessions: Session[], now: Date): SessionWithTiming[] {
  return sessions.map((s) => ({ ...s, timing: deriveTiming(s, now) }))
}

export interface AgendaKpis {
  currentTimeLabel: string
  overallProgressPct: number
  liveCount: number
  overtimeCount: number
  issueCount: number
  endedEarlyCount: number
  nextTransitionLabel: string
  nextTransitionMinutes: number | null
}

export function computeKpis(sessions: SessionWithTiming[], now: Date): AgendaKpis {
  const active = sessions.filter((s) => s.status !== 'cancelled')
  const total = active.length || 1

  const endedCount = active.filter((s) =>
    ['ended', 'ended_early'].includes(s.timing.effective_status) ||
    (s.timing.effective_status === 'overtime' && s.completed_at)
  ).length
  const liveCount = active.filter((s) => s.timing.effective_status === 'live').length
  const overtimeCount = active.filter(
    (s) => s.timing.effective_status === 'overtime' && !s.completed_at
  ).length
  const issueCount = active.filter((s) => s.timing.effective_status === 'issue').length
  const endedEarlyCount = active.filter((s) => s.timing.effective_status === 'ended_early').length

  const overallProgressPct = Math.round(((endedCount + liveCount * 0.5) / total) * 100)

  // 다음 전환: 시작 예정 세션의 시작까지, 또는 진행중 세션의 예정 종료까지 중 가장 가까운 것
  let nextLabel = '-'
  let nextMinutes: number | null = null
  const nowMs = now.getTime()
  for (const s of active) {
    if (!s.started_at && s.timing.effective_status !== 'cancelled' && s.planned_start_at) {
      const diffMin = Math.round((new Date(s.planned_start_at).getTime() - nowMs) / 60000)
      if (diffMin >= 0 && (nextMinutes === null || diffMin < nextMinutes)) {
        nextMinutes = diffMin
        nextLabel = `${s.title} 시작`
      }
    }
    if (s.started_at && !s.completed_at && s.planned_end_at) {
      const diffMin = Math.round((new Date(s.planned_end_at).getTime() - nowMs) / 60000)
      if (diffMin >= 0 && (nextMinutes === null || diffMin < nextMinutes)) {
        nextMinutes = diffMin
        nextLabel = `${s.title} 종료 예정`
      }
    }
  }

  return {
    currentTimeLabel: formatTime(now),
    overallProgressPct: Math.max(0, Math.min(100, overallProgressPct)),
    liveCount,
    overtimeCount,
    issueCount,
    endedEarlyCount,
    nextTransitionLabel: nextLabel,
    nextTransitionMinutes: nextMinutes,
  }
}

export function formatTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatTimeRange(start: string | null, end: string | null): string {
  if (!start || !end) return '--'
  return `${formatTime(start)}–${formatTime(end)}`
}

export function formatMinutes(min: number | null): string {
  if (min === null) return '-'
  const sign = min < 0 ? '-' : ''
  const abs = Math.abs(min)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  if (h > 0) return `${sign}${h}시간 ${m}분`
  return `${sign}${m}분`
}

interface StatusMeta {
  label: string
  badgeClass: string
  dotClass: string
}

export const STATUS_META: Record<EffectiveStatus, StatusMeta> = {
  scheduled: { label: '예정', badgeClass: 'bg-gray-200 text-gray-700 border border-gray-300', dotClass: 'bg-gray-400' },
  ready: { label: '준비중', badgeClass: 'bg-blue-100 text-blue-700 border border-blue-300', dotClass: 'bg-blue-500' },
  live: { label: '진행중', badgeClass: 'bg-green-100 text-green-700 border border-green-400', dotClass: 'bg-green-500' },
  paused: { label: '일시정지', badgeClass: 'bg-amber-100 text-amber-700 border border-amber-400', dotClass: 'bg-amber-500' },
  ended: { label: '종료', badgeClass: 'bg-gray-700 text-white border border-gray-700', dotClass: 'bg-gray-300' },
  overtime: { label: '시간 초과', badgeClass: 'bg-orange-100 text-orange-700 border border-orange-400', dotClass: 'bg-orange-500' },
  ended_early: { label: '조기 종료', badgeClass: 'bg-teal-100 text-teal-700 border border-teal-400', dotClass: 'bg-teal-500' },
  issue: { label: '이슈', badgeClass: 'bg-red-100 text-red-700 border border-red-400', dotClass: 'bg-red-600' },
  cancelled: { label: '취소', badgeClass: 'bg-gray-100 text-gray-400 border border-gray-200', dotClass: 'bg-gray-300' },
}

export function statusMeta(status: EffectiveStatus): StatusMeta {
  return STATUS_META[status]
}
