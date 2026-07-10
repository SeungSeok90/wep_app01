import { formatMinutes, formatTimeRange } from '@/lib/session-logic'
import StatusBadge from './StatusBadge'
import type { ConsoleSession } from './types'
import type { DerivedTiming } from '@/lib/types'

const TONE_BG: Record<string, string> = {
  scheduled: 'bg-white border-slate-200',
  ready: 'bg-blue-50 border-blue-300',
  live: 'bg-green-50 border-green-400',
  paused: 'bg-amber-50 border-amber-400',
  ended: 'bg-slate-100 border-slate-300',
  overtime: 'bg-orange-50 border-orange-400',
  ended_early: 'bg-teal-50 border-teal-400',
  issue: 'bg-red-50 border-red-400',
  cancelled: 'bg-slate-50 border-slate-200 opacity-60',
}

export default function MorningTimeline({ sessions }: { sessions: ConsoleSession[] }) {
  if (sessions.length === 0) return null
  const sorted = [...sessions].sort((a, b) => {
    if (!a.planned_start_at) return 1
    if (!b.planned_start_at) return -1
    return new Date(a.planned_start_at).getTime() - new Date(b.planned_start_at).getTime()
  })

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">오전 공통 세션</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {sorted.map((s) => {
          const tone = TONE_BG[s.timing.effective_status] ?? TONE_BG.scheduled
          return (
            <div key={s.id} className={`flex flex-col gap-1.5 rounded-lg border-2 px-3 py-2.5 ${tone}`}>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-slate-500">
                  {formatTimeRange(s.planned_start_at, s.planned_end_at)}
                </span>
                <StatusBadge status={s.timing.effective_status} size="sm" />
              </div>
              <p className="break-words text-sm font-bold leading-snug text-slate-900">{s.title}</p>
              {(s.speaker || s.company) && (
                <p className="truncate text-xs text-slate-600">
                  {s.speaker}{s.speaker && s.company ? ' · ' : ''}{s.company}
                </p>
              )}
              <OvertimeOrEarlyNote timing={s.timing} hasIssue={!!s.issue_note} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

function OvertimeOrEarlyNote({ timing, hasIssue }: { timing: DerivedTiming; hasIssue: boolean }) {
  if (hasIssue) return <p className="text-xs font-semibold text-red-600">⚠ 이슈 발생</p>
  if (timing.overtime_minutes > 0) {
    return <p className="text-xs font-semibold text-orange-600">+{formatMinutes(timing.overtime_minutes)} 초과</p>
  }
  if (timing.early_finish_minutes > 0) {
    return <p className="text-xs font-semibold text-teal-600">-{formatMinutes(timing.early_finish_minutes)} 조기종료</p>
  }
  return null
}
