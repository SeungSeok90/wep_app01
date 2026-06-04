'use client'

import { useState } from 'react'
import type { NametagTemplate, NametagFieldStyle } from '@/lib/types'
import { DEFAULT_NAMETAG_TEMPLATE } from '@/lib/types'
import NametagPreview from './NametagPreview'
import Link from 'next/link'

const PAPER_PRESETS = [
  { label: '명함 (90×54mm)', width_mm: 90, height_mm: 54 },
  { label: 'A6 (105×148mm)', width_mm: 105, height_mm: 148 },
  { label: 'A5 (148×210mm)', width_mm: 148, height_mm: 210 },
]

const FIELD_LABELS: Record<keyof NametagTemplate['fields'], string> = {
  event_name: '행사명',
  name: '이름',
  company: '회사명',
  department: '부서',
  position: '직급',
}

const FONTS = [
  { label: '고딕', value: 'sans-serif' },
  { label: '명조', value: 'serif' },
  { label: '모노', value: 'monospace' },
]

export default function NametagDesigner({
  eventId,
  eventName,
  initialTemplate,
}: {
  eventId: string
  eventName: string
  initialTemplate: NametagTemplate
}) {
  const [template, setTemplate] = useState<NametagTemplate>(initialTemplate)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function updateField(key: keyof NametagTemplate['fields'], patch: Partial<NametagFieldStyle>) {
    setTemplate((t) => ({ ...t, fields: { ...t.fields, [key]: { ...t.fields[key], ...patch } } }))
    setSaved(false)
  }

  function updateQr(patch: Partial<NametagTemplate['qr']>) {
    setTemplate((t) => ({ ...t, qr: { ...t.qr, ...patch } }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/events/${eventId}/nametag-template`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    })
    setSaving(false)
    setSaved(true)
  }

  function handlePreset(preset: typeof PAPER_PRESETS[0]) {
    setTemplate((t) => ({ ...t, width_mm: preset.width_mm, height_mm: preset.height_mm }))
    setSaved(false)
  }

  // 미리보기 스케일 (화면에 맞게 축소)
  const previewScale = Math.min(1, 280 / (template.width_mm * 3.78))

  return (
    <div className="flex gap-6">
      {/* 설정 패널 */}
      <div className="w-72 shrink-0 flex flex-col gap-4">

        {/* 용지 설정 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-sm mb-3">용지 설정</h3>

          <div className="flex flex-col gap-2 mb-3">
            {PAPER_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePreset(p)}
                className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                  template.width_mm === p.width_mm && template.height_mm === p.height_mm
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">너비(mm)</label>
              <input
                type="number"
                value={template.width_mm}
                onChange={(e) => setTemplate((t) => ({ ...t, width_mm: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">높이(mm)</label>
              <input
                type="number"
                value={template.height_mm}
                onChange={(e) => setTemplate((t) => ({ ...t, height_mm: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs text-slate-400 mb-1 block">페이지당 네임택</label>
            <div className="flex gap-1">
              {([1, 2, 4, 6] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setTemplate((t) => ({ ...t, per_page: n }))}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                    template.per_page === n
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {n}개
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs text-slate-400 mb-1 block">배경색</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={template.background}
                onChange={(e) => setTemplate((t) => ({ ...t, background: e.target.value }))}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
              />
              <span className="text-xs text-slate-500">{template.background}</span>
            </div>
          </div>
        </div>

        {/* QR 설정 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">QR코드</h3>
            <button
              onClick={() => updateQr({ visible: !template.qr.visible })}
              className={`text-xs px-2 py-1 rounded-full ${template.qr.visible ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
            >
              {template.qr.visible ? 'ON' : 'OFF'}
            </button>
          </div>
          {template.qr.visible && (
            <>
              <div className="mb-2">
                <label className="text-xs text-slate-400 mb-1 block">위치</label>
                <div className="grid grid-cols-2 gap-1">
                  {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => updateQr({ position: pos })}
                      className={`text-xs py-1.5 rounded-lg border transition-colors ${
                        template.qr.position === pos
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {pos === 'top-left' ? '좌상단' : pos === 'top-right' ? '우상단' : pos === 'bottom-left' ? '좌하단' : '우하단'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">크기</label>
                <div className="flex gap-1">
                  {(['small', 'medium', 'large'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateQr({ size: s })}
                      className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                        template.qr.size === s
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {s === 'small' ? '소' : s === 'medium' ? '중' : '대'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 필드 설정 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-sm mb-3">필드 설정</h3>
          <div className="flex flex-col gap-4">
            {(Object.keys(template.fields) as Array<keyof typeof template.fields>).map((key) => {
              const f = template.fields[key]
              return (
                <div key={key} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">{FIELD_LABELS[key]}</span>
                    <button
                      onClick={() => updateField(key, { visible: !f.visible })}
                      className={`text-xs px-2 py-0.5 rounded-full ${f.visible ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {f.visible ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {f.visible && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">크기(px)</label>
                        <input
                          type="number"
                          value={f.fontSize}
                          min={6} max={72}
                          onChange={(e) => updateField(key, { fontSize: Number(e.target.value) })}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">폰트</label>
                        <select
                          value={f.fontFamily}
                          onChange={(e) => updateField(key, { fontFamily: e.target.value })}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {FONTS.map((ft) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">정렬</label>
                        <div className="flex gap-1">
                          {(['left', 'center', 'right'] as const).map((a) => (
                            <button
                              key={a}
                              onClick={() => updateField(key, { align: a })}
                              className={`flex-1 py-1 text-xs rounded border transition-colors ${f.align === a ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}
                            >
                              {a === 'left' ? '좌' : a === 'center' ? '중' : '우'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">굵기</label>
                        <button
                          onClick={() => updateField(key, { bold: !f.bold })}
                          className={`w-full py-1 text-xs rounded border transition-colors ${f.bold ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200'}`}
                        >
                          {f.bold ? 'Bold' : 'Normal'}
                        </button>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 block mb-1">색상</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={f.color}
                            onChange={(e) => updateField(key, { color: e.target.value })}
                            className="w-7 h-7 rounded border border-slate-200 cursor-pointer"
                          />
                          <span className="text-xs text-slate-400">{f.color}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 미리보기 + 액션 */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center gap-4">
          <h3 className="font-semibold text-sm self-start">미리보기</h3>
          <div className="border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <NametagPreview
              template={template}
              eventName={eventName}
              qrUrl="https://example.com/attend/sample"
              scale={previewScale}
            />
          </div>
          <p className="text-xs text-slate-400">실제 크기: {template.width_mm}×{template.height_mm}mm</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            {saving ? '저장 중...' : saved ? '✓ 저장됨' : '템플릿 저장'}
          </button>
          <button
            onClick={() => setTemplate(DEFAULT_NAMETAG_TEMPLATE)}
            className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            초기화
          </button>
          <Link
            href={`/admin/events/${eventId}/print-nametags`}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            🖨️ 전체 출력
          </Link>
        </div>
      </div>
    </div>
  )
}
