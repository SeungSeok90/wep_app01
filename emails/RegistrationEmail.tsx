import { Text, Button, Img } from '@react-email/components'
import BaseLayout from './BaseLayout'
import InfoCard from './InfoCard'

export interface RegistrationEmailProps {
  registrantName: string
  eventName: string
  eventDate: string | null
  location: string | null
  attendanceType: 'offline' | 'online'
  eventType: 'offline' | 'online' | 'hybrid'
  liveUrl?: string
  qrImageUrl?: string
}

export default function RegistrationEmail({
  registrantName,
  eventName,
  eventDate,
  location,
  attendanceType,
  eventType,
  liveUrl,
  qrImageUrl,
}: RegistrationEmailProps) {
  const isOnline = attendanceType === 'online'
  const hasLive = eventType !== 'offline' && isOnline

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
        weekday: 'long', hour: '2-digit', minute: '2-digit',
      })
    : null

  const infoItems = [
    ...(formattedDate ? [{ icon: '📅', label: '행사 일시', value: formattedDate }] : []),
    ...(!isOnline && location ? [{ icon: '📍', label: '장소', value: location }] : []),
    { icon: '🎫', label: '참석 방식', value: isOnline ? '온라인 참석' : '현장 참석' },
  ]

  return (
    <BaseLayout
      preview={`${eventName} 등록이 완료되었습니다`}
      headerSubtitle="등록 완료"
      headerTitle={eventName}
      footerText={`${eventName} 등록 확인 메일입니다.`}
    >
      <Text style={greeting}>
        안녕하세요, <strong>{registrantName}</strong>님.<br />
        행사 등록이 성공적으로 완료되었습니다.
      </Text>

      <InfoCard items={infoItems} />

      {qrImageUrl && (
        <>
          <Text style={sectionLabel}>현장 입장 QR 코드</Text>
          <Img
            src={qrImageUrl}
            width="180"
            height="180"
            alt="입장 QR 코드"
            style={qrStyle}
          />
        </>
      )}

      {hasLive && liveUrl && (
        <>
          <Text style={liveHint}>행사 당일 아래 버튼으로 라이브에 입장하세요.</Text>
          <Button href={liveUrl} style={button}>
            라이브 입장하기 →
          </Button>
        </>
      )}

      <Text style={closing}>
        문의 사항이 있으시면 행사 담당자에게 연락해 주세요.
      </Text>
    </BaseLayout>
  )
}

const greeting: React.CSSProperties = {
  margin: '0 0 24px',
  color: '#1e293b',
  fontSize: '15px',
  lineHeight: '1.6',
}

const sectionLabel: React.CSSProperties = {
  margin: '0 0 12px',
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

const liveHint: React.CSSProperties = {
  margin: '0 0 12px',
  color: '#475569',
  fontSize: '14px',
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
