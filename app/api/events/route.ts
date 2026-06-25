import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { renderRegistrationEmail, renderReminderEmail } from '@/lib/email'

export async function GET() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { data, error } = await supabase.from('events').insert(body).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 기본 이메일 템플릿 자동 생성
  try {
    const event = data
    const origin = process.env.NEXT_PUBLIC_BASE_URL ?? ''
    const liveUrl = event.slug ? `${origin}/${event.slug}/live` : undefined

    const [registrationHtml, reminderHtml] = await Promise.all([
      renderRegistrationEmail({
        registrantName: '{{name}}',
        eventName: event.name,
        eventDate: event.event_date ?? null,
        location: event.location ?? null,
        attendanceType: event.event_type === 'online' ? 'online' : 'offline',
        eventType: event.event_type ?? 'offline',
        liveUrl,
      }),
      renderReminderEmail({
        registrantName: '{{name}}',
        eventName: event.name,
        eventDate: event.event_date ?? null,
        location: event.location ?? null,
        attendanceType: event.event_type === 'online' ? 'online' : 'offline',
        eventType: event.event_type ?? 'offline',
        liveUrl,
      }),
    ])

    await supabaseAdmin.from('message_templates').insert([
      {
        event_id: event.id,
        name: '등록 완료',
        type: 'registration',
        is_default: true,
        subject: `[${event.name}] 등록이 완료되었습니다`,
        body_html: registrationHtml,
      },
      {
        event_id: event.id,
        name: '참석 리마인드',
        type: 'reminder',
        is_default: true,
        subject: `[${event.name}] 행사 참석 안내`,
        body_html: reminderHtml,
      },
    ])
  } catch (_) {
    // 템플릿 생성 실패해도 행사 생성은 성공으로 처리
  }

  return NextResponse.json(data, { status: 201 })
}
