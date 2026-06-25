import { Resend } from 'resend'
import { render } from '@react-email/components'
import RegistrationEmail from '@/emails/RegistrationEmail'
import ReminderEmail, { type ReminderEmailProps } from '@/emails/ReminderEmail'
import CustomEmail, { type CustomEmailProps } from '@/emails/CustomEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

// ── 등록 완료 메일 ────────────────────────────────────────────────────────────

export interface ConfirmationEmailParams {
  to: string
  registrantName: string
  eventName: string
  eventDate: string | null
  location: string | null
  attendanceType: 'offline' | 'online'
  eventType: 'offline' | 'online' | 'hybrid'
  slug: string
  subject?: string | null
  origin: string
}

export async function sendConfirmationEmail(params: ConfirmationEmailParams) {
  const {
    to, registrantName, eventName, eventDate, location,
    attendanceType, eventType, slug, subject, origin,
  } = params

  const resolvedSubject = subject?.trim() || `[${eventName}] 등록이 완료되었습니다`
  const liveUrl = `${origin}/${slug}/live`

  const html = await render(
    RegistrationEmail({
      registrantName, eventName, eventDate, location,
      attendanceType, eventType, liveUrl,
    })
  )

  const { error } = await resend.emails.send({ from: FROM, to, subject: resolvedSubject, html })
  if (error) throw new Error(error.message)
}

// ── 리마인드 메일 ─────────────────────────────────────────────────────────────

export interface ReminderEmailSendParams extends Omit<ReminderEmailProps, 'registrantName'> {
  to: string
  registrantName: string
  subject: string
}

export async function sendReminderEmail(params: ReminderEmailSendParams) {
  const { to, subject, ...rest } = params

  const html = await render(ReminderEmail(rest))
  const { error } = await resend.emails.send({ from: FROM, to, subject, html })
  if (error) throw new Error(error.message)
}

// ── 커스텀 메일 ───────────────────────────────────────────────────────────────

export interface CustomEmailSendParams extends Omit<CustomEmailProps, 'registrantName'> {
  to: string
  registrantName: string
  subject: string
}

export async function sendCustomEmail(params: CustomEmailSendParams) {
  const { to, subject, ...rest } = params

  const html = await render(CustomEmail(rest))
  const { error } = await resend.emails.send({ from: FROM, to, subject, html })
  if (error) throw new Error(error.message)
}

// ── HTML 렌더링만 (미리보기용) ───────────────────────────────────────────────

export async function renderRegistrationEmail(props: Parameters<typeof RegistrationEmail>[0]) {
  return render(RegistrationEmail(props))
}

export async function renderReminderEmail(props: Parameters<typeof ReminderEmail>[0]) {
  return render(ReminderEmail(props))
}

export async function renderCustomEmail(props: Parameters<typeof CustomEmail>[0]) {
  return render(CustomEmail(props))
}
