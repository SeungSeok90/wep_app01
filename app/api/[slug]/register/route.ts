import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, register_start, register_end, target_count')
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

  if (event.target_count) {
    const { count } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)

    if (count !== null && count >= event.target_count) {
      return NextResponse.json({ error: '정원이 초과되었습니다.' }, { status: 400 })
    }
  }

  const body = await request.json()
  const { data, error } = await supabase
    .from('registrations')
    .insert({ ...body, event_id: event.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
