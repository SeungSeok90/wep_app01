import { Section, Row, Column, Text } from '@react-email/components'

interface InfoItem {
  icon: string
  label: string
  value: string
}

export default function InfoCard({ items }: { items: InfoItem[] }) {
  return (
    <Section style={card}>
      {items.map((item, i) => (
        <Row key={i} style={i < items.length - 1 ? rowWithMargin : row}>
          <Column style={iconCol}>
            <Text style={iconStyle}>{item.icon}</Text>
          </Column>
          <Column>
            <Text style={labelStyle}>{item.label}</Text>
            <Text style={valueStyle}>{item.value}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  )
}

const card: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderRadius: '10px',
  padding: '20px 24px',
  marginBottom: '24px',
}

const row: React.CSSProperties = { verticalAlign: 'top' }
const rowWithMargin: React.CSSProperties = { ...row, paddingBottom: '14px' }

const iconCol: React.CSSProperties = {
  width: '32px',
  verticalAlign: 'top',
}

const iconStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '16px',
  lineHeight: '1',
}

const labelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#94a3b8',
}

const valueStyle: React.CSSProperties = {
  margin: '3px 0 0',
  fontSize: '14px',
  color: '#1e293b',
  fontWeight: '500',
}
