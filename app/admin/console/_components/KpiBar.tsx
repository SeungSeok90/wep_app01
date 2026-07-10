import type { AgendaKpis } from '@/lib/session-logic'
import { formatMinutes } from '@/lib/session-logic'

function KpiCard({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'warn' | 'danger' | 'info' | 'teal'
}) {
  const toneClass: Record<string, string> = {
    default: 'text-slate-900',
    warn: 'text-orange-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
    teal: 'text-teal-600',
  }
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <span className={`text-2xl font-bold tabular-nums ${toneClass[tone]}`}>{value}</span>
    </div>
  )
}

export default function KpiBar({ kpis }: { kpis: AgendaKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      <KpiCard label="현재 시각" value={kpis.currentTimeLabel} />
      <KpiCard label="전체 진행률" value={`${kpis.overallProgressPct}%`} tone="info" />
      <KpiCard label="진행중 세션" value={`${kpis.liveCount}건`} />
      <KpiCard label="시간 초과" value={`${kpis.overtimeCount}건`} tone={kpis.overtimeCount > 0 ? 'warn' : 'default'} />
      <KpiCard label="이슈" value={`${kpis.issueCount}건`} tone={kpis.issueCount > 0 ? 'danger' : 'default'} />
      <KpiCard label="조기 종료" value={`${kpis.endedEarlyCount}건`} tone="teal" />
      <KpiCard
        label="다음 전환까지"
        value={kpis.nextTransitionMinutes !== null ? formatMinutes(kpis.nextTransitionMinutes) : '-'}
        tone="info"
      />
    </div>
  )
}
