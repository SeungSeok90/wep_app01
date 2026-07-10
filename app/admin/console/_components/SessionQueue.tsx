'use client'

import { formatTimeRange } from '@/lib/session-logic'
import StatusBadge from './StatusBadge'
import type { ConsoleSession } from './types'

function bucket(s: ConsoleSession): 'live' | 'issue' | 'upcoming' | 'ended' {
  const st = s.timing.effective_status
  if (st === 'issue') return 'issue'
  if (['live', 'paused', 'overtime'].includes(st) && !s.completed_at) return 'live'
  if (['ended', 'ended_early'].includes(st) || (st === 'overtime' && s.completed_at)) return 'ended'
  return 'upcoming'
}

export default function SessionQueue({
  sessions,
  selectedId,
  onSelect,
}: {
  sessions: ConsoleSession[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const sorted = [...sessions].sort((a, b) => {
    if (!a.planned_start_at) return 1
    if (!b.planned_start_at) return -1
    return new Date(a.planned_start_at).getTime() - new Date(b.planned_start_at).getTime()
  })
  const groups: { key: string; label: string; items: ConsoleSession[] }[] = [
    { key: 'issue', label: '이슈', items: sorted.filter((s) => bucket(s) === 'issue') },
    { key: 'live', label: '진행중', items: sorted.filter((s) => bucket(s) === 'live') },
    { key: 'upcoming', label: '예정', items: sorted.filter((s) => bucket(s) === 'upcoming') },
    { key: 'ended', label: '종료', items: sorted.filter((s) => bucket(s) === 'ended') },
  ]

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-3 py-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">세션 큐 (시간순)</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groups.map(
          (g) =>
            g.items.length > 0 && (
              <div key={g.key}>
                <div className="sticky top-0 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-400">
                  {g.label} ({g.items.length})
                </div>
                {g.items.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelect(s.id)}
                    className={`flex w-full flex-col gap-1 border-b border-slate-100 px-3 py-2 text-left transition hover:bg-slate-50 ${
                      s.id === selectedId ? 'bg-blue-50 ring-1 ring-inset ring-blue-300' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {formatTimeRange(s.planned_start_at, s.planned_end_at)}
                      </span>
                      <StatusBadge status={s.timing.effective_status} size="sm" />
                    </div>
                    <span className="truncate text-xs font-semibold text-slate-800">{s.title}</span>
                    <span className="truncate text-[11px] text-slate-400">{s.track_name}</span>
                  </button>
                ))}
              </div>
            )
        )}
      </div>
    </div>
  )
}
