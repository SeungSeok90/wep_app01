import type { Session, SessionDelay, DelayStatus } from './types'

/** 초를 "MM:SS" 형식으로 변환 */
export function formatDuration(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds)
  const m = Math.floor(abs / 60).toString().padStart(2, '0')
  const s = (abs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/**
 * 현재 시각 기준으로 세션 딜레이를 계산.
 * - live 상태: started_at 기준으로 planned_end_at 까지 남은 시간 대비
 * - completed 상태: completed_at vs planned_end_at 비교
 */
export function calcDelay(session: Session, now = new Date()): SessionDelay | null {
  if (session.status === 'ready') return null

  const reference = session.status === 'completed' && session.completed_at
    ? new Date(session.completed_at)
    : now

  if (!session.planned_end_at) return null

  const plannedEnd = new Date(session.planned_end_at)
  const diffSeconds = Math.floor((reference.getTime() - plannedEnd.getTime()) / 1000)

  let status: DelayStatus
  if (diffSeconds < 0) status = 'on-time'
  else if (diffSeconds < 300) status = 'warning'
  else status = 'danger'

  const sign = diffSeconds >= 0 ? '+' : '-'
  const label = `${sign}${formatDuration(diffSeconds)}`

  return { diffSeconds, status, label }
}

/** live 세션의 경과 시간(초) */
export function elapsedSeconds(session: Session, now = new Date()): number {
  if (!session.started_at) return 0
  return Math.floor((now.getTime() - new Date(session.started_at).getTime()) / 1000)
}
