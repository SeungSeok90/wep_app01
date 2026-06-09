import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { sendConfirmationEmail } from '@/lib/email'

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, type, register_start, register_end, target_count, offline_capacity, online_capacity, name, location, event_date, confirmation_email_enabled, confirmation_email_subject')
    .eq('slug', slug)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: '행사를 찾을 수 없습니다.' }, { status: 404 })
  }

  const now = new Date()
  if (event.register_start && new Date(event.register_start) > now) {
    return NextResponse.json({ error: '등록 기간이 아직 시작되지 않았습니다.' }, { status: 400 })
  }
  if (event.register_end && new Date(event.register_end) < now) {
    return NextResponse.json({ error: '등록 기간이 마감되었습니다.' }, { status: 400 })
  }

  const body = await request.json()
  const attendanceType: 'offline' | 'online' = body.attendance_type ?? 'offline'

  // 하이브리드: 참석 방식별 정원 체크
  if (event.type === 'hybrid') {
    if (attendanceType === 'offline' && event.offline_capacity) {
      const { count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('attendance_type', 'offline')

      if (count !== null && count >= event.offline_capacity) {
        return NextResponse.json({ error: '현장 참석 정원이 마감되었습니다.' }, { status: 400 })
      }
    }
    if (attendanceType === 'online' && event.online_capacity) {
      const { count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('attendance_type', 'online')

      if (count !== null && count >= event.online_capacity) {
        return NextResponse.json({ error: '온라인 참석 정원이 마감되었습니다.' }, { status: 400 })
      }
    }
  } else {
    // 단일 유형: 기존 정원 체크
    const capacity = event.type === 'online' ? event.online_capacity : event.offline_capacity
    const total = capacity ?? event.target_count
    if (total) {
      const { count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)

      if (count !== null && count >= total) {
        return NextResponse.json({ error: '정원이 마감되었습니다.' }, { status: 400 })
      }
    }
  }

  const { data, error } = await supabase
    .from('registrations')
    .insert({ ...body, event_id: event.id, attendance_type: attendanceType })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (event.confirmation_email_enabled && data.email) {
    const origin = new URL(request.url).origin
    sendConfirmationEmail({
      to: data.email,
      registrantName: data.name,
      eventName: event.name,
      eventDate: event.event_date,
      location: event.location,
      attendanceType: data.attendance_type,
      eventType: event.type,
      slug,
      subject: event.confirmation_email_subject,
      origin,
    }).catch((err) => console.error('[email] 발송 실패:', err))
  }

  return NextResponse.json(data, { status: 201 })
}
