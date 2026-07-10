'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Event, EventField, FieldType } from '@/lib/types'

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: '단답형 텍스트',
  textarea: '장문',
  select: '드롭다운',
  radio: '단일 선택',
  checkbox: '다중 선택',
}

// datetime-local 값(타임존 정보 없음)을 브라우저 로컬 시간 기준으로 해석해 UTC ISO 문자열로 변환.
// 그대로 저장하면 Postgres가 UTC로 오인해 9시간(KST 오프셋)이 밀린다.
function toIsoOrNull(localDatetime: string): string | null {
  if (!localDatetime) return null
  return new Date(localDatetime).toISOString()
}

// 저장된 UTC ISO 문자열을 datetime-local input에 채울 로컬(KST) 시각 문자열로 변환.
// .slice(0, 16)으로 그냥 잘라 쓰면 UTC 시각 숫자를 그대로 보여줘서 9시간 어긋나 보인다.
function toLocalDatetime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EventEditForm({ event, fields: initialFields }: { event: Event; fields: EventField[] }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<EventField[]>(initialFields)
  const [newField, setNewField] = useState({ label: '', field_type: 'text' as FieldType, is_required: false, options: '' })
  const [addingField, setAddingField] = useState(false)

  async function handleEventSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const form = e.currentTarget
    const data = {
      name: form.eventName.value,
      slug: form.slug.value,
      location: form.location.value || null,
      event_date: toIsoOrNull(form.event_date.value),
      organizer: form.organizer.value || null,
      target_count: form.target_count.value ? Number(form.target_count.value) : null,
      register_start: toIsoOrNull(form.register_start.value),
      register_end: toIsoOrNull(form.register_end.value),
    }

    const res = await fetch(`/api/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? '저장 실패')
    }
    setSaving(false)
  }

  async function handleAddField() {
    if (!newField.label.trim()) return
    const options = ['select', 'radio', 'checkbox'].includes(newField.field_type)
      ? newField.options.split('\n').map((o) => o.trim()).filter(Boolean)
      : null

    const res = await fetch(`/api/events/${event.id}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: newField.label,
        field_type: newField.field_type,
        is_required: newField.is_required,
        options,
        sort_order: fields.length,
      }),
    })
    const created = await res.json()
    setFields([...fields, created])
    setNewField({ label: '', field_type: 'text', is_required: false, options: '' })
    setAddingField(false)
  }

  async function handleDeleteField(fieldId: string) {
    await fetch(`/api/events/${event.id}/fields/${fieldId}`, { method: 'DELETE' })
    setFields(fields.filter((f) => f.id !== fieldId))
  }

  const needsOptions = ['select', 'radio', 'checkbox'].includes(newField.field_type)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex">
        <aside className="w-56 min-h-screen bg-slate-900 text-white flex flex-col">
          <div className="px-6 py-5 border-b border-slate-700">
            <span className="font-bold text-lg">등록 플랫폼</span>
            <span className="ml-2 text-xs bg-indigo-600 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <nav className="flex flex-col gap-1 p-4 flex-1">
            <a href="/admin" className="px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              행사 관리
            </a>
          </nav>
        </aside>

        <main className="flex-1 p-8 max-w-2xl">
          <div className="mb-6">
            <a href="/admin" className="text-slate-400 hover:text-slate-600 text-sm">← 목록으로</a>
            <h1 className="text-2xl font-bold mt-2">행사 편집</h1>
          </div>

          {/* 행사 기본 정보 */}
          <form onSubmit={handleEventSave} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 mb-6">
            <h2 className="font-semibold text-base">기본 정보</h2>
            {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">행사명 *</label>
                <input name="eventName" defaultValue={event.name} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">URL 슬러그 *</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">도메인/</span>
                  <input name="slug" defaultValue={event.slug} required className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">행사 장소</label>
                <input name="location" defaultValue={event.location ?? ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">행사 일시</label>
                <input name="event_date" type="datetime-local" defaultValue={toLocalDatetime(event.event_date)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">주관사 담당자</label>
                <input name="organizer" defaultValue={event.organizer ?? ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">등록 타겟 인원</label>
                <input name="target_count" type="number" min="1" defaultValue={event.target_count ?? ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div />
              <div>
                <label className="block text-sm font-medium mb-1">등록 시작일시</label>
                <input name="register_start" type="datetime-local" defaultValue={toLocalDatetime(event.register_start)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">등록 마감일시</label>
                <input name="register_end" type="datetime-local" defaultValue={toLocalDatetime(event.register_end)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-6 py-2 rounded-lg transition-colors">
                {saving ? '저장 중...' : '저장'}
              </button>
              <a href={`/${event.slug}`} target="_blank" className="text-indigo-600 hover:underline text-sm px-4 py-2">
                등록 페이지 보기 →
              </a>
            </div>
          </form>

          {/* 커스텀 필드 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-base">추가 등록 필드</h2>
                <p className="text-xs text-slate-400 mt-0.5">기본 필드(이름, 이메일, 연락처, 회사명, 부서, 직급) 외 추가 항목</p>
              </div>
              <button
                onClick={() => setAddingField(true)}
                className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                + 필드 추가
              </button>
            </div>

            {fields.length === 0 && !addingField && (
              <p className="text-slate-400 text-sm text-center py-6">추가 필드가 없습니다.</p>
            )}

            <div className="flex flex-col gap-2 mb-4">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                  <div>
                    <span className="text-sm font-medium">{field.label}</span>
                    {field.is_required && <span className="ml-1 text-red-400 text-xs">*</span>}
                    <span className="ml-2 text-xs text-slate-400">{FIELD_TYPE_LABELS[field.field_type]}</span>
                    {field.options && (
                      <span className="ml-2 text-xs text-slate-400">({field.options.join(', ')})</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="text-red-400 hover:text-red-600 text-xs transition-colors"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            {addingField && (
              <div className="border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">필드명 *</label>
                    <input
                      value={newField.label}
                      onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                      placeholder="예: 사는 지역"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">타입</label>
                    <select
                      value={newField.field_type}
                      onChange={(e) => setNewField({ ...newField, field_type: e.target.value as FieldType })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {needsOptions && (
                  <div>
                    <label className="block text-xs font-medium mb-1">선택지 (줄바꿈으로 구분)</label>
                    <textarea
                      value={newField.options}
                      onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                      placeholder={"서울\n경기\n부산"}
                      rows={3}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.is_required}
                    onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })}
                  />
                  필수 항목
                </label>
                <div className="flex gap-2">
                  <button onClick={handleAddField} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                    추가
                  </button>
                  <button onClick={() => setAddingField(false)} className="text-slate-500 text-sm px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
