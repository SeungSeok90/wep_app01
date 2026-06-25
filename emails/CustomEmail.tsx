import { Text, Img, Button } from '@react-email/components'
import BaseLayout from './BaseLayout'

export interface CustomEmailProps {
  registrantName: string
  eventName: string
  bodyHtml?: string       // 관리자가 입력한 본문 (변수 치환 완료 상태)
  qrImageUrl?: string
  ctaLabel?: string | null
  ctaUrl?: string | null
  headerColor?: string
}

export default function CustomEmail({
  registrantName,
  eventName,
  bodyHtml,
  qrImageUrl,
  ctaLabel,
  ctaUrl,
  headerColor = '#6366f1',
}: CustomEmailProps) {
  return (
    <BaseLayout
      preview={`${eventName} 안내드립니다`}
      headerTitle={eventName}
      headerColor={headerColor}
      footerText={`${eventName} 안내 메일입니다.`}
    >
      <Text style={greeting}>
        안녕하세요, <strong>{registrantName}</strong>님.
      </Text>

      {/* 관리자가 작성한 본문 (줄바꿈 유지) */}
      {bodyHtml && (
        <Text style={bodyText}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      )}

      {qrImageUrl && (
        <>
          <Text style={qrLabel}>입장 QR 코드</Text>
          <Img
            src={qrImageUrl}
            width="180"
            height="180"
            alt="QR 코드"
            style={qrStyle}
          />
        </>
      )}

      {ctaLabel && ctaUrl && (
        <Button href={ctaUrl} style={button}>
          {ctaLabel}
        </Button>
      )}

      <Text style={closing}>
        문의 사항이 있으시면 행사 담당자에게 연락해 주세요.
      </Text>
    </BaseLayout>
  )
}

const greeting: React.CSSProperties = {
  margin: '0 0 20px',
  color: '#1e293b',
  fontSize: '15px',
  lineHeight: '1.6',
}

const bodyText: React.CSSProperties = {
  margin: '0 0 24px',
  color: '#334155',
  fontSize: '15px',
  lineHeight: '1.8',
  whiteSpace: 'pre-wrap',
}

const qrLabel: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: '13px',
  fontWeight: '600',
  color: '#475569',
}

const qrStyle: React.CSSProperties = {
  display: 'block',
  margin: '0 0 24px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
}

const button: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#6366f1',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 28px',
  borderRadius: '8px',
  marginBottom: '24px',
}

const closing: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: '13px',
  lineHeight: '1.6',
}
