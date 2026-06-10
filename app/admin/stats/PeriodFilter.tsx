'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const PERIODS = [
  { value: 'today', label: '오늘' },
  { value: '7',     label: '7일' },
  { value: '30',    label: '30일' },
  { value: 'all',   label: '전체' },
]

export default function PeriodFilter({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => select(p.value)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            current === p.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
