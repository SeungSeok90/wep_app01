'use client'

import { QRCodeSVG } from 'qrcode.react'
import type { NametagTemplate, NametagElement, Registration } from '@/lib/types'

const BUILTIN_SAMPLE: Record<string, string> = {
  name: '홍길동',
  company: '삼성전자',
  department: '개발팀',
  position: '수석',
  email: 'hong@samsung.com',
  phone: '010-1234-5678',
  event_name: '행사명 예시',
}

function getValue(el: NametagElement, registration?: Partial<Registration>, eventName?: string): string {
  if (el.type === 'qr') return ''
  if (el.fieldKey === 'event_name') return eventName ?? BUILTIN_SAMPLE.event_name
  if (registration) {
    const r = registration as Record<string, unknown>
    if (el.fieldKey in r && r[el.fieldKey]) return String(r[el.fieldKey])
    const custom = (registration.custom_answers ?? {}) as Record<string, string | string[]>
    if (el.fieldKey in custom) {
      const v = custom[el.fieldKey]
      return Array.isArray(v) ? v.join(', ') : v
    }
    return ''
  }
  return BUILTIN_SAMPLE[el.fieldKey] ?? `[${el.fieldLabel}]`
}

interface Props {
  template: NametagTemplate
  registration?: Partial<Registration>
  eventName?: string
  qrUrl?: string
  /** 실제 mm 단위로 렌더 (인쇄용) */
  forPrint?: boolean
  /** 화면 표시용 스케일 (1mm = PX_PER_MM * scale px) */
  scale?: number
}

const PX_PER_MM = 3.7795

export default function NametagCard({
  template,
  registration,
  eventName,
  qrUrl = 'https://example.com',
  forPrint = false,
  scale = 1,
}: Props) {
  const { width_mm, height_mm, background, elements } = template

  const containerStyle: React.CSSProperties = forPrint
    ? { position: 'relative', width: `${width_mm}mm`, height: `${height_mm}mm`, background, overflow: 'hidden', boxSizing: 'border-box' }
    : { position: 'relative', width: `${width_mm * PX_PER_MM * scale}px`, height: `${height_mm * PX_PER_MM * scale}px`, background, overflow: 'hidden', boxSizing: 'border-box' }

  return (
    <div style={containerStyle}>
      {elements.map((el) => {
        const elStyle: React.CSSProperties = forPrint
          ? { position: 'absolute', left: `${el.x}mm`, top: `${el.y}mm` }
          : { position: 'absolute', left: `${el.x * PX_PER_MM * scale}px`, top: `${el.y * PX_PER_MM * scale}px` }

        if (el.type === 'qr') {
          const sizePx = forPrint
            ? (el.size ?? 40) * PX_PER_MM   // mm → px (브라우저가 처리)
            : (el.size ?? 40) * PX_PER_MM * scale
          return (
            <div key={el.id} style={elStyle}>
              <QRCodeSVG value={qrUrl} size={Math.round(sizePx)} />
            </div>
          )
        }

        const value = getValue(el, registration, eventName)
        if (!value) return null

        const textStyle: React.CSSProperties = {
          fontSize: forPrint ? `${el.fontSize}pt` : `${el.fontSize * scale}px`,
          fontWeight: el.bold ? 'bold' : 'normal',
          color: el.color,
          fontFamily: el.fontFamily,
          textAlign: el.align,
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }

        return (
          <div key={el.id} style={elStyle}>
            <span style={textStyle}>{value}</span>
          </div>
        )
      })}
    </div>
  )
}
