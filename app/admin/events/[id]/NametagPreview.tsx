'use client'

import { QRCodeSVG } from 'qrcode.react'
import type { NametagTemplate, Registration } from '@/lib/types'

const QR_SIZES = { small: 48, medium: 64, large: 80 }

interface Props {
  template: NametagTemplate
  registration?: Partial<Registration>
  eventName?: string
  qrUrl?: string
  forPrint?: boolean
  scale?: number
}

const SAMPLE: Partial<Registration> = {
  name: '홍길동',
  company: '삼성전자',
  department: '개발팀',
  position: '수석',
}

export default function NametagPreview({
  template,
  registration,
  eventName = '행사명 예시',
  qrUrl = 'https://example.com',
  forPrint = false,
  scale = 1,
}: Props) {
  const r = registration ?? SAMPLE
  const { fields, qr, background, width_mm, height_mm } = template
  const qrSize = QR_SIZES[qr.size]

  const isRight = qr.position.includes('right')
  const isTop = qr.position.includes('top')

  const containerStyle: React.CSSProperties = forPrint
    ? { width: `${width_mm}mm`, height: `${height_mm}mm`, backgroundColor: background, position: 'relative', overflow: 'hidden', boxSizing: 'border-box', padding: '4mm' }
    : { width: `${width_mm * 3.78 * scale}px`, height: `${height_mm * 3.78 * scale}px`, backgroundColor: background, position: 'relative', overflow: 'hidden', padding: `${4 * scale * 3.78}px`, borderRadius: 8, boxSizing: 'border-box' }

  function textStyle(f: typeof fields.name): React.CSSProperties {
    return {
      fontSize: forPrint ? `${f.fontSize}pt` : `${f.fontSize * scale}px`,
      fontWeight: f.bold ? 'bold' : 'normal',
      textAlign: f.align,
      color: f.color,
      fontFamily: f.fontFamily,
      lineHeight: 1.3,
    }
  }

  const qrContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: isTop ? (forPrint ? '4mm' : `${4 * scale * 3.78}px`) : 'auto',
    bottom: !isTop ? (forPrint ? '4mm' : `${4 * scale * 3.78}px`) : 'auto',
    right: isRight ? (forPrint ? '4mm' : `${4 * scale * 3.78}px`) : 'auto',
    left: !isRight ? (forPrint ? '4mm' : `${4 * scale * 3.78}px`) : 'auto',
  }

  const contentWidth = qr.visible
    ? `calc(100% - ${(qrSize + (forPrint ? 12 : 12 * scale))}px)`
    : '100%'

  const contentStyle: React.CSSProperties = {
    width: contentWidth,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: forPrint ? '1mm' : `${1 * scale * 3.78}px`,
    marginLeft: !isRight && qr.visible ? 'auto' : undefined,
  }

  const scaledQrSize = forPrint ? qrSize : Math.round(qrSize * scale)

  return (
    <div style={containerStyle}>
      {qr.visible && (
        <div style={qrContainerStyle}>
          <QRCodeSVG value={qrUrl} size={scaledQrSize} />
        </div>
      )}
      <div style={{ ...contentStyle, marginLeft: isRight ? undefined : (qr.visible ? (forPrint ? `${qrSize + 8}px` : `${(qrSize + 8) * scale}px`) : undefined) }}>
        {fields.event_name.visible && (
          <p style={textStyle(fields.event_name)}>{eventName}</p>
        )}
        {fields.name.visible && (
          <p style={textStyle(fields.name)}>{r.name}</p>
        )}
        {fields.company.visible && (
          <p style={textStyle(fields.company)}>{r.company}</p>
        )}
        {(fields.department.visible || fields.position.visible) && (
          <p style={textStyle(fields.department)}>
            {fields.department.visible && r.department}
            {fields.department.visible && fields.position.visible && r.department && r.position && ' · '}
            {fields.position.visible && r.position}
          </p>
        )}
      </div>
    </div>
  )
}
