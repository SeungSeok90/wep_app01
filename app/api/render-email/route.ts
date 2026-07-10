import { NextResponse } from 'next/server'
import { renderRegistrationEmail, renderReminderEmail, renderCustomEmail } from '@/lib/email'

export async function POST(req: Request) {
  const body = await req.json()
  const {
    type,
    eventName,
    eventDate,
    location,
    attendanceType,
    eventType,
    liveUrl,
    bodyHtml,
  } = body

  try {
    let html: string

    if (type === 'registration') {
      html = await renderRegistrationEmail({
        registrantName: '홍길동',
        eventName, eventDate, location,
        attendanceType: attendanceType ?? 'offline',
        eventType: eventType ?? 'offline',
        liveUrl,
      })
    } else if (type === 'reminder') {
      html = await renderReminderEmail({
        registrantName: '홍길동',
        eventName, eventDate, location,
        attendanceType: attendanceType ?? 'offline',
        eventType: eventType ?? 'offline',
        liveUrl,
      })
    } else {
      html = await renderCustomEmail({
        registrantName: '홍길동',
        eventName,
        bodyHtml: bodyHtml ?? '',
      })
    }

    return NextResponse.json({ html })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '렌더링 실패'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
