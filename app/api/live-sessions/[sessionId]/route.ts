import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ sessionId: string }> }

// 하트비트 또는 퇴장 처리
export async function PATCH(request: Request, { params }: Params) {
  const { sessionId } = await params
  const body = await request.json()
  const { action, channel_id } = body // action: 'heartbeat' | 'leave' | 'channel_change'

  if (action === 'heartbeat') {
    const { error } = await supabase
      .from('webinar_sessions')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', sessionId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'leave') {
    const { data: session } = await supabase
      .from('webinar_sessions')
      .select('joined_at')
      .eq('id', sessionId)
      .single()

    const now = new Date()
    const duration = session?.joined_at
      ? Math.floor((now.getTime() - new Date(session.joined_at).getTime()) / 1000)
      : 0

    const { error } = await supabase
      .from('webinar_sessions')
      .update({ left_at: now.toISOString(), duration_seconds: duration, last_seen: now.toISOString() })
      .eq('id', sessionId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, duration_seconds: duration })
  }

  if (action === 'channel_change') {
    // 채널 변경 시 channel_id 업데이트 + joined_at 갱신
    const { error } = await supabase
      .from('webinar_sessions')
      .update({ channel_id: channel_id ?? null, joined_at: new Date().toISOString(), last_seen: new Date().toISOString() })
      .eq('id', sessionId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'invalid action' }, { status: 400 })
}
