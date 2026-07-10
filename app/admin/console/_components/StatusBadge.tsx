import { statusMeta } from '@/lib/session-logic'
import type { EffectiveStatus } from '@/lib/types'

export default function StatusBadge({ status, size = 'md' }: { status: EffectiveStatus; size?: 'sm' | 'md' }) {
  const meta = statusMeta(status)
  const sizeClass = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClass} ${meta.badgeClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  )
}
