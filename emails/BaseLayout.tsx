import {
  Html, Head, Body, Container, Section,
  Text, Hr, Preview,
} from '@react-email/components'
import { ReactNode } from 'react'

interface Props {
  preview?: string
  headerTitle: string
  headerSubtitle?: string
  headerColor?: string
  children: ReactNode
  footerText?: string
}

export default function BaseLayout({
  preview,
  headerTitle,
  headerSubtitle,
  headerColor = '#6366f1',
  children,
  footerText,
}: Props) {
  return (
    <Html lang="ko">
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={body}>
        <Container style={container}>

          {/* 헤더 */}
          <Section style={{ ...header, backgroundColor: headerColor }}>
            {headerSubtitle && (
              <Text style={headerSubtitleStyle}>{headerSubtitle}</Text>
            )}
            <Text style={headerTitleStyle}>{headerTitle}</Text>
          </Section>

          {/* 본문 */}
          <Section style={content}>
            {children}
          </Section>

          {/* 푸터 */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerTextStyle}>
              {footerText ?? '이 메일은 자동 발송되었습니다.'}
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

// ── 스타일 ─────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  margin: 0,
  padding: 0,
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '40px auto',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
}

const header: React.CSSProperties = {
  padding: '32px 40px',
}

const headerSubtitleStyle: React.CSSProperties = {
  margin: '0 0 6px',
  color: 'rgba(255,255,255,0.8)',
  fontSize: '13px',
}

const headerTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: '700',
  lineHeight: '1.3',
}

const content: React.CSSProperties = {
  padding: '36px 40px',
}

const hr: React.CSSProperties = {
  borderColor: '#f1f5f9',
  margin: '0 40px',
}

const footer: React.CSSProperties = {
  padding: '20px 40px',
}

const footerTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#cbd5e1',
  fontSize: '12px',
}
