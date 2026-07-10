import type { ConsoleSession } from './types'

function BigStat({ label, value, tone }: { label: string; value: string; tone: 'neutral' | 'danger' | 'teal' | 'info' }) {
  const toneClass: Record<string, string> = {
    neutral: 'text-slate-900',
    danger: 'text-orange-600',
    teal: 'text-teal-600',
    info: 'text-blue-600',
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`text-4xl font-extrabold tabular-nums ${toneClass[tone]}`}>{value}</span>
    </div>
  )
}

export default function TimerPanel({ session }: { session: ConsoleSession }) {
  const { timing } = session
  const remaining = timing.remaining_minutes
  const overtime = timing.overtime_minutes
  const early = timing.early_finish_minutes
  const pct = timing.slide_progress_pct

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-3 gap-3">
        <BigStat
          label="남은 시간"
          value={remaining !== null ? `${remaining}분` : '-'}
          tone={overtime > 0 ? 'danger' : 'neutral'}
        />
        <BigStat label="초과 시간" value={overtime > 0 ? `+${overtime}분` : '0분'} tone={overtime > 0 ? 'danger' : 'neutral'} />
        <BigStat label="조기 종료" value={early > 0 ? `-${early}분` : '0분'} tone={early > 0 ? 'teal' : 'neutral'} />
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="mb-1.5 flex items-end justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">장표 진행률</span>
          <span className="text-xl font-extrabold tabular-nums text-slate-900">
            {session.current_slide} <span className="text-sm text-slate-400">/ {session.total_slides || '-'}</span>
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}
