'use client'

import { useRef, useState } from 'react'
import Draggable from 'react-draggable'
import { QRCodeSVG } from 'qrcode.react'
import type { NametagTemplate, NametagElement, EventField } from '@/lib/types'
import { DEFAULT_NAMETAG_TEMPLATE } from '@/lib/types'
import Link from 'next/link'

const PX_PER_MM = 3.7795
const CANVAS_W = 480

const PAPER_PRESETS = [
  { label: '명함 (90×54mm)',   width_mm: 90,  height_mm: 54  },
  { label: 'A6 (105×148mm)',  width_mm: 105, height_mm: 148 },
  { label: 'A5 (148×210mm)',  width_mm: 148, height_mm: 210 },
]

const BUILTIN_FIELDS = [
  { key: 'event_name', label: '행사명' },
  { key: 'name',       label: '이름' },
  { key: 'company',    label: '회사명' },
  { key: 'department', label: '부서' },
  { key: 'position',   label: '직급' },
  { key: 'email',      label: '이메일' },
  { key: 'phone',      label: '연락처' },
]

const FONTS = [
  { label: '고딕', value: 'sans-serif' },
  { label: '명조', value: 'serif' },
  { label: '모노', value: 'monospace' },
]

const BUILTIN_SAMPLE: Record<string, string> = {
  event_name: '행사명 예시', name: '홍길동', company: '삼성전자',
  department: '개발팀', position: '수석', email: 'hong@example.com', phone: '010-1234-5678',
}

function uid() { return `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }

// 드래그 가능한 요소 (개별 ref 필요)
function DraggableEl({
  el, scale, selected,
  onSelect, onStop,
  sampleValue,
}: {
  el: NametagElement
  scale: number
  selected: boolean
  onSelect: () => void
  onStop: (x: number, y: number) => void
  sampleValue: string
}) {
  const nodeRef = useRef<HTMLDivElement>(null)

  const px = (mm: number) => mm * PX_PER_MM * scale

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      position={{ x: px(el.x), y: px(el.y) }}
      onStop={(_, d) => onStop(d.x / (PX_PER_MM * scale), d.y / (PX_PER_MM * scale))}
      bounds="parent"
    >
      <div
        ref={nodeRef}
        onClick={(e) => { e.stopPropagation(); onSelect() }}
        style={{
          position: 'absolute',
          cursor: 'grab',
          userSelect: 'none',
          outline: selected ? '2px solid #6366f1' : '1px dashed #cbd5e1',
          outlineOffset: 2,
          padding: 2,
          borderRadius: 2,
          top: 0, left: 0,
        }}
      >
        {el.type === 'qr' ? (
          <QRCodeSVG value="https://example.com" size={Math.round((el.size ?? 40) * PX_PER_MM * scale)} />
        ) : (
          <span style={{
            fontSize: `${el.fontSize * scale}px`,
            fontWeight: el.bold ? 'bold' : 'normal',
            color: el.color,
            fontFamily: el.fontFamily,
            textAlign: el.align,
            whiteSpace: 'nowrap',
            display: 'block',
          }}>
            {sampleValue || `[${el.fieldLabel}]`}
          </span>
        )}
      </div>
    </Draggable>
  )
}

function sanitizeTemplate(t: unknown): NametagTemplate {
  if (!t || typeof t !== 'object') return DEFAULT_NAMETAG_TEMPLATE
  const obj = t as Record<string, unknown>
  if (!Array.isArray(obj.elements)) return { ...DEFAULT_NAMETAG_TEMPLATE, ...(obj as Partial<NametagTemplate>) , elements: DEFAULT_NAMETAG_TEMPLATE.elements }
  return t as NametagTemplate
}

export default function NametagDesigner({
  eventId,
  eventName,
  initialTemplate,
  customFields,
}: {
  eventId: string
  eventName: string
  initialTemplate: NametagTemplate
  customFields: EventField[]
}) {
  const [template, setTemplate] = useState<NametagTemplate>(sanitizeTemplate(initialTemplate))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const scale = CANVAS_W / (template.width_mm * PX_PER_MM)
  const canvasH = Math.round(template.height_mm * PX_PER_MM * scale)

  const selectedEl = template.elements.find((e) => e.id === selectedId) ?? null

  // 요소 업데이트
  function updateEl(id: string, patch: Partial<NametagElement>) {
    setTemplate((t) => ({ ...t, elements: t.elements.map((e) => e.id === id ? { ...e, ...patch } : e) }))
    setSaved(false)
  }

  // 위치 업데이트
  function updatePos(id: string, x: number, y: number) {
    setTemplate((t) => ({
      ...t,
      elements: t.elements.map((e) => e.id === id ? { ...e, x: Math.max(0, Math.round(x * 10) / 10), y: Math.max(0, Math.round(y * 10) / 10) } : e),
    }))
    setSaved(false)
  }

  // 필드 추가
  function addField(fieldKey: string, fieldLabel: string, isQr = false) {
    const already = template.elements.some((e) => e.fieldKey === fieldKey)
    if (already) return
    const newEl: NametagElement = {
      id: uid(),
      type: isQr ? 'qr' : 'field',
      fieldKey, fieldLabel,
      x: 5, y: 5,
      fontSize: isQr ? 0 : 12,
      bold: false, color: '#000000',
      align: 'left', fontFamily: 'sans-serif',
      size: isQr ? 40 : undefined,
    }
    setTemplate((t) => ({ ...t, elements: [...t.elements, newEl] }))
    setSelectedId(newEl.id)
    setSaved(false)
  }

  // 요소 삭제
  function deleteEl(id: string) {
    setTemplate((t) => ({ ...t, elements: t.elements.filter((e) => e.id !== id) }))
    setSelectedId(null)
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

  const usedKeys = new Set(template.elements.map((e) => e.fieldKey))
  const availableBuiltin = BUILTIN_FIELDS.filter((f) => !usedKeys.has(f.key))
  const availableCustom = customFields.filter((f) => !usedKeys.has(f.label))
  const hasQr = usedKeys.has('qr')

  return (
    <div className="flex gap-4 h-full">

      {/* 왼쪽: 필드 팔레트 */}
      <div className="w-52 shrink-0 flex flex-col gap-3">
        {/* 용지 설정 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">용지 크기</p>
          <div className="flex flex-col gap-1 mb-3">
            {PAPER_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setTemplate((t) => ({ ...t, width_mm: p.width_mm, height_mm: p.height_mm })); setSaved(false) }}
                className={`text-left text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  template.width_mm === p.width_mm && template.height_mm === p.height_mm
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-400 mb-1">너비(mm)</p>
              <input type="number" value={template.width_mm}
                onChange={(e) => { setTemplate((t) => ({ ...t, width_mm: Number(e.target.value) })); setSaved(false) }}
                className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">높이(mm)</p>
              <input type="number" value={template.height_mm}
                onChange={(e) => { setTemplate((t) => ({ ...t, height_mm: Number(e.target.value) })); setSaved(false) }}
                className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-slate-400 mb-1">배경색</p>
            <div className="flex items-center gap-2">
              <input type="color" value={template.background}
                onChange={(e) => { setTemplate((t) => ({ ...t, background: e.target.value })); setSaved(false) }}
                className="w-7 h-7 rounded border border-slate-200 cursor-pointer" />
              <span className="text-xs text-slate-400">{template.background}</span>
            </div>
          </div>
        </div>

        {/* 추가 가능 필드 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex-1">
          <p className="text-xs font-semibold text-slate-500 mb-2">+ 필드 추가</p>

          {!hasQr && (
            <button
              onClick={() => addField('qr', 'QR코드', true)}
              className="w-full text-left text-xs px-3 py-2 mb-1 rounded-lg border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              ▣ QR코드
            </button>
          )}

          {availableBuiltin.length > 0 && (
            <>
              <p className="text-xs text-slate-400 mt-2 mb-1">기본 필드</p>
              {availableBuiltin.map((f) => (
                <button
                  key={f.key}
                  onClick={() => addField(f.key, f.label)}
                  className="w-full text-left text-xs px-3 py-1.5 mb-1 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  + {f.label}
                </button>
              ))}
            </>
          )}

          {availableCustom.length > 0 && (
            <>
              <p className="text-xs text-slate-400 mt-2 mb-1">커스텀 필드</p>
              {availableCustom.map((f) => (
                <button
                  key={f.id}
                  onClick={() => addField(f.label, f.label)}
                  className="w-full text-left text-xs px-3 py-1.5 mb-1 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  + {f.label}
                </button>
              ))}
            </>
          )}

          {availableBuiltin.length === 0 && availableCustom.length === 0 && hasQr && (
            <p className="text-xs text-slate-400 text-center py-4">추가 가능한 필드 없음</p>
          )}
        </div>
      </div>

      {/* 가운데: 캔버스 */}
      <div className="flex-1 flex flex-col items-center gap-4">
        <div
          className="relative shadow-lg border border-slate-300"
          style={{ width: CANVAS_W, height: canvasH, background: template.background, overflow: 'hidden' }}
          onClick={() => setSelectedId(null)}
        >
          {template.elements.map((el) => (
            <DraggableEl
              key={el.id}
              el={el}
              scale={scale}
              selected={selectedId === el.id}
              onSelect={() => setSelectedId(el.id)}
              onStop={(x, y) => updatePos(el.id, x, y)}
              sampleValue={el.fieldKey === 'event_name' ? eventName : (BUILTIN_SAMPLE[el.fieldKey] ?? `[${el.fieldLabel}]`)}
            />
          ))}
        </div>

        <p className="text-xs text-slate-400">
          {template.width_mm}×{template.height_mm}mm · 필드를 드래그해서 위치 조정
        </p>

        {/* 저장 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            {saving ? '저장 중...' : saved ? '✓ 저장됨' : '템플릿 저장'}
          </button>
          <button
            onClick={() => { setTemplate(DEFAULT_NAMETAG_TEMPLATE); setSelectedId(null); setSaved(false) }}
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

      {/* 오른쪽: 선택 필드 옵션 */}
      <div className="w-56 shrink-0">
        {selectedEl ? (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">{selectedEl.fieldLabel}</p>
              <button
                onClick={() => deleteEl(selectedEl.id)}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                삭제
              </button>
            </div>

            {selectedEl.type === 'qr' ? (
              <div>
                <p className="text-xs text-slate-400 mb-1">QR 크기 (mm)</p>
                <input
                  type="number" min={10} max={80}
                  value={selectedEl.size ?? 40}
                  onChange={(e) => updateEl(selectedEl.id, { size: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-400 mt-3 mb-1">위치 (mm)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">X</p>
                    <input type="number" value={selectedEl.x}
                      onChange={(e) => updateEl(selectedEl.id, { x: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Y</p>
                    <input type="number" value={selectedEl.y}
                      onChange={(e) => updateEl(selectedEl.id, { y: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">폰트 크기 (px)</p>
                  <input type="number" min={6} max={72} value={selectedEl.fontSize}
                    onChange={(e) => updateEl(selectedEl.id, { fontSize: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">폰트</p>
                  <select value={selectedEl.fontFamily}
                    onChange={(e) => updateEl(selectedEl.id, { fontFamily: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">굵기</p>
                  <button
                    onClick={() => updateEl(selectedEl.id, { bold: !selectedEl.bold })}
                    className={`w-full py-2 text-sm rounded-lg border transition-colors ${selectedEl.bold ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 text-slate-500'}`}
                  >
                    {selectedEl.bold ? 'Bold' : 'Normal'}
                  </button>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">정렬</p>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map((a) => (
                      <button key={a}
                        onClick={() => updateEl(selectedEl.id, { align: a })}
                        className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${selectedEl.align === a ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}
                      >
                        {a === 'left' ? '좌' : a === 'center' ? '중' : '우'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">색상</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={selectedEl.color}
                      onChange={(e) => updateEl(selectedEl.id, { color: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer" />
                    <span className="text-xs text-slate-400">{selectedEl.color}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">위치 (mm)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">X</p>
                      <input type="number" value={selectedEl.x}
                        onChange={(e) => updateEl(selectedEl.id, { x: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Y</p>
                      <input type="number" value={selectedEl.y}
                        onChange={(e) => updateEl(selectedEl.id, { y: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
            <p className="mb-1">필드를 클릭하면</p>
            <p>옵션이 표시됩니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
