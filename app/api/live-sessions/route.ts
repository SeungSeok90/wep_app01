import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { event_id, channel_id, user_name } = body

  const { data, error } = await supabase
    .from('webinar_sessions')
    .insert({ event_id, channel_id: channel_id ?? null, user_name, joined_at: new Date().toISOString(), last_seen: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
