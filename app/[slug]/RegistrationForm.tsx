'use client'

import { useState } from 'react'
import type { EventField } from '@/lib/types'

export default function RegistrationForm({
  slug,
  fields,
  eventType,
}: {
  slug: string
  fields: EventField[]
  eventType: 'offline' | 'online' | 'hybrid'
}) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | string[]>>({})
  const [attendanceType, setAttendanceType] = useState<'offline' | 'online'>(
    eventType === 'online' ? 'online' : 'offline'
  )

  function handleCustomChange(label: string, value: string, isCheckbox = false) {
    if (isCheckbox) {
      const current = (customAnswers[label] as string[]) ?? []
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      setCustomAnswers({ ...customAnswers, [label]: updated })
    } else {
      setCustomAnswers({ ...customAnswers, [label]: value })
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    const data = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      phone: (fd.get('phone') as string) || null,
      company: (fd.get('company') as string) || null,
      department: (fd.get('department') as string) || null,
      position: (fd.get('position') as string) || null,
      attendance_type: attendanceType,
      custom_answers: customAnswers,
    }

    const res = await fetch(`/api/${slug}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? '등록 실패. 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-lg font-semibold mb-2">등록이 완료되었습니다!</h2>
        <p className="text-slate-500 text-sm">
          {attendanceType === 'online' ? '온라인으로 참석하실 수 있습니다.' : '현장에서 뵙겠습니다.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

      {/* 하이브리드: 참석 방식 선택 */}
      {eventType === 'hybrid' && (
        <div>
          <label className="block text-sm font-medium mb-2">참석 방식 *</label>
          <div className="flex gap-3">
            {([
              { value: 'offline', label: '🏢 현장 참석' },
              { value: 'online', label: '🌐 온라인 시청' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setAttendanceType(value)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  attendanceType === value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">이름 *</label>
          <input name="name" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">이메일 *</label>
          <input name="email" type="email" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">연락처</label>
          <input name="phone" type="tel" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">회사명</label>
          <input name="company" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">부서</label>
          <input name="department" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">직급</label>
          <input name="position" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {fields.map((field) => (
        <div key={field.id}>
          <label className="block text-sm font-medium mb-1">
            {field.label}
            {field.is_required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          {field.field_type === 'text' && (
            <input required={field.is_required} onChange={(e) => handleCustomChange(field.label, e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          )}
          {field.field_type === 'textarea' && (
            <textarea required={field.is_required} rows={3} onChange={(e) => handleCustomChange(field.label, e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          )}
          {field.field_type === 'select' && (
            <select required={field.is_required} onChange={(e) => handleCustomChange(field.label, e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">선택하세요</option>
              {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}
          {field.field_type === 'radio' && (
            <div className="flex flex-col gap-2">
              {field.options?.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name={`custom_${field.id}`} value={opt} required={field.is_required} onChange={(e) => handleCustomChange(field.label, e.target.value)} />
                  {opt}
                </label>
              ))}
            </div>
          )}
          {field.field_type === 'checkbox' && (
            <div className="flex flex-col gap-2">
              {field.options?.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" value={opt} onChange={() => handleCustomChange(field.label, opt, true)} />
                  {opt}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors mt-2"
      >
        {loading ? '등록 중...' : '등록하기'}
      </button>
    </form>
  )
}
