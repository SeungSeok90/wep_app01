'use client'

import { useState } from 'react'
import type { Event, EventField, FieldType } from '@/lib/types'

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: '단답형 텍스트',
  textarea: '장문',
  select: '드롭다운',
  radio: '단일 선택',
  checkbox: '다중 선택',
}

export default function FieldsManager({ event, fields: initialFields }: { event: Event; fields: EventField[] }) {
  const [fields, setFields] = useState<EventField[]>(initialFields)
  const [newField, setNewField] = useState({ label: '', field_type: 'text' as FieldType, is_required: false, options: '' })
  const [addingField, setAddingField] = useState(false)

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl">
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
        <p className="text-slate-400 text-sm text-center py-8">추가 필드가 없습니다.</p>
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
                placeholder={'서울\n경기\n부산'}
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
  )
}
