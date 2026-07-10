import { formatMinutes, formatTime, formatTimeRange } from '@/lib/session-logic'
import StatusBadge from './StatusBadge'
import type { ConsoleSession } from './types'
import type { Track } from '@/lib/types'
import type { CSSProperties } from 'react'

const STEP_MINUTES = 10
const LABEL_STEP_ROWS = 3 // 30분 간격으로 시간 라벨 표시

const CARD_TONE: Record<string, string> = {
  scheduled: 'bg-white border-slate-300',
  ready: 'bg-blue-50 border-blue-400',
  live: 'bg-green-50 border-green-500',
  paused: 'bg-amber-50 border-amber-500',
  ended: 'bg-slate-100 border-slate-400',
  overtime: 'bg-orange-50 border-orange-500',
  ended_early: 'bg-teal-50 border-teal-500',
  issue: 'bg-red-50 border-red-500',
  cancelled: 'bg-slate-50 border-slate-200',
}

function allocatedMinutes(s: ConsoleSession): number {
  if (!s.planned_start_at || !s.planned_end_at) return STEP_MINUTES
  return Math.max(
    STEP_MINUTES,
    Math.round((new Date(s.planned_end_at).getTime() - new Date(s.planned_start_at).getTime()) / 60000)
  )
}

export default function TrackGrid({ sessions, tracks }: { sessions: ConsoleSession[]; tracks: Track[] }) {
  const timed = sessions.filter((s) => s.planned_start_at && s.planned_end_at)
  if (timed.length === 0 || tracks.length === 0) return null

  const gridStartMs = Math.min(...timed.map((s) => new Date(s.planned_start_at as string).getTime()))
  const gridEndMs = Math.max(...timed.map((s) => new Date(s.planned_end_at as string).getTime()))
  const totalRows = Math.max(1, Math.round((gridEndMs - gridStartMs) / (STEP_MINUTES * 60000)))

  const labelRows: { label: string; rowStart: number; rowSpan: number }[] = []
  for (let r = 0; r < totalRows; r += LABEL_STEP_ROWS) {
    const span = Math.min(LABEL_STEP_ROWS, totalRows - r)
    labelRows.push({
      label: formatTime(new Date(gridStartMs + r * STEP_MINUTES * 60000)),
      rowStart: r + 1,
      rowSpan: span,
    })
  }

  const columnTemplate = `64px repeat(${tracks.length}, minmax(220px, 1fr))`

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">오후 트랙 세션</h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="min-w-[960px]">
          <div className="grid border-b border-slate-200 bg-slate-50" style={{ gridTemplateColumns: columnTemplate }}>
            <div className="px-2 py-2" />
            {tracks.map((t) => (
              <div key={t.id} className="px-3 py-2 text-center text-sm font-bold text-slate-700">{t.name}</div>
            ))}
          </div>

          <div
            className="grid bg-slate-200"
            style={{
              gridTemplateColumns: columnTemplate,
              gridTemplateRows: `repeat(${totalRows}, 28px)`,
              gap: '1px',
            }}
          >
            {labelRows.map((l) => (
              <div
                key={l.rowStart}
                className="flex items-start justify-center bg-slate-50 pt-1 text-[11px] font-semibold text-slate-500"
                style={{ gridColumn: 1, gridRow: `${l.rowStart} / span ${l.rowSpan}` }}
              >
                {l.label}
              </div>
            ))}

            {tracks.map((track, ti) =>
              timed
                .filter((s) => s.track_id === track.id)
                .map((s) => {
                  const rowStart =
                    Math.round((new Date(s.planned_start_at as string).getTime() - gridStartMs) / (STEP_MINUTES * 60000)) + 1
                  const rowSpan = Math.max(1, Math.round(allocatedMinutes(s) / STEP_MINUTES))
                  return (
                    <SessionCell
                      key={s.id}
                      session={s}
                      style={{ gridColumn: ti + 2, gridRow: `${rowStart} / span ${rowSpan}` }}
                    />
                  )
                })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function SessionCell({ session, style }: { session: ConsoleSession; style: CSSProperties }) {
  const tone = CARD_TONE[session.timing.effective_status] ?? CARD_TONE.scheduled
  const isShort = allocatedMinutes(session) <= 30

  return (
    <div
      style={style}
      className={`flex flex-col gap-1 overflow-hidden border-2 px-2.5 py-2 ${tone} ${
        session.status === 'cancelled' ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-semibold text-slate-500">
          {formatTimeRange(session.planned_start_at, session.planned_end_at)}
        </span>
        <StatusBadge status={session.timing.effective_status} size="sm" />
      </div>
      <p className={`break-words font-bold leading-snug text-slate-900 ${isShort ? 'text-xs' : 'text-sm'}`}>
        {session.title}
      </p>
      {!isShort && (session.speaker || session.company) && (
        <p className="truncate text-xs text-slate-600">
          {session.speaker}{session.speaker && session.company ? ' · ' : ''}{session.company}
        </p>
      )}
      <Note session={session} />
    </div>
  )
}

function Note({ session }: { session: ConsoleSession }) {
  const { timing, issue_note } = session
  if (issue_note) return <p className="truncate text-xs font-semibold text-red-600">⚠ 이슈 발생</p>
  if (timing.overtime_minutes > 0)
    return <p className="text-xs font-semibold text-orange-600">+{formatMinutes(timing.overtime_minutes)} 초과</p>
  if (timing.early_finish_minutes > 0)
    return <p className="text-xs font-semibold text-teal-600">-{formatMinutes(timing.early_finish_minutes)} 조기종료</p>
  return null
}
