import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { renderRegistrationEmail, renderReminderEmail } from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id: event_id } = await params
  const { data, error } = await supabaseAdmin
    .from('message_templates')
    .select('*')
    .eq('event_id', event_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request, { params }: Params) {
  const { id: event_id } = await params
  const body = await req.json()
  const { name, type, subject, body_html, is_default } = body

  const { data, error } = await supabaseAdmin
    .from('message_templates')
    .insert({ event_id, name, type: type ?? 'custom', subject, body_html, is_default: is_default ?? false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// 행사 생성 시 기본 템플릿 자동 생성
export async function PUT(req: Request, { params }: Params) {
  const { id: event_id } = await params
  const body = await req.json()
  const { eventName, eventDate, location, attendanceType, eventType, slug, origin } = body

  const liveUrl = origin && slug ? `${origin}/${slug}/live` : undefined

  const [registrationHtml, reminderHtml] = await Promise.all([
    renderRegistrationEmail({
      registrantName: '{{name}}',
      eventName, eventDate, location,
      attendanceType: attendanceType ?? 'offline',
      eventType: eventType ?? 'offline',
      liveUrl,
    }),
    renderReminderEmail({
      registrantName: '{{name}}',
      eventName, eventDate, location,
      attendanceType: attendanceType ?? 'offline',
      eventType: eventType ?? 'offline',
      liveUrl,
    }),
  ])

  const templates = [
    {
      event_id,
      name: '등록 완료',
      type: 'registration',
      is_default: true,
      subject: `[${eventName}] 등록이 완료되었습니다`,
      body_html: registrationHtml,
    },
    {
      event_id,
      name: '참석 리마인드',
      type: 'reminder',
      is_default: true,
      subject: `[${eventName}] 행사 참석 안내`,
      body_html: reminderHtml,
    },
  ]

  const { data, error } = await supabaseAdmin
    .from('message_templates')
    .insert(templates)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
