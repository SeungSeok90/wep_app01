'use client'

import { ReactNode } from 'react'

export function SectionCard({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  )
}

export function BigButton({
  children,
  onClick,
  tone = 'default',
  disabled = false,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  tone?: 'default' | 'primary' | 'danger' | 'warn' | 'ghost'
  disabled?: boolean
  className?: string
}) {
  const toneClass: Record<string, string> = {
    default: 'bg-slate-800 text-white hover:bg-slate-900',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    warn: 'bg-amber-500 text-white hover:bg-amber-600',
    ghost: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-3 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClass[tone]} ${className}`}
    >
      {children}
    </button>
  )
}

export function SegGroup<T extends string>({
  options,
  value,
  onChange,
  dangerValues = [],
  warnValues = [],
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  dangerValues?: T[]
  warnValues?: T[]
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value
        const isDanger = dangerValues.includes(opt.value)
        const isWarn = warnValues.includes(opt.value)
        let activeClass = 'bg-slate-800 text-white border-slate-800'
        if (active && isDanger) activeClass = 'bg-red-600 text-white border-red-600'
        else if (active && isWarn) activeClass = 'bg-amber-500 text-white border-amber-500'
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
              active ? activeClass : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function NumField({
  label,
  value,
  onCommit,
  min = 0,
  max,
  suffix,
}: {
  label: string
  value: number
  onCommit: (v: number) => void
  min?: number
  max?: number
  suffix?: string
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          defaultValue={value}
          key={value}
          min={min}
          max={max}
          onBlur={(e) => {
            const v = Number(e.target.value)
            if (!Number.isNaN(v)) onCommit(Math.max(min, max !== undefined ? Math.min(max, v) : v))
          }}
          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-sm font-semibold tabular-nums"
        />
        {suffix && <span className="text-xs text-slate-400">{suffix}</span>}
      </span>
    </label>
  )
}

export function TextField({
  label,
  value,
  onCommit,
  placeholder,
  multiline = false,
}: {
  label: string
  value: string
  onCommit: (v: string) => void
  placeholder?: string
  multiline?: boolean
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-600">{label}</span>
      {multiline ? (
        <textarea
          defaultValue={value}
          key={value}
          placeholder={placeholder}
          onBlur={(e) => onCommit(e.target.value)}
          rows={2}
          className="resize-none rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      ) : (
        <input
          type="text"
          defaultValue={value}
          key={value}
          placeholder={placeholder}
          onBlur={(e) => onCommit(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      )}
    </label>
  )
}
