import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { track_id, title, speaker, company, category, planned_start_at, planned_end_at, total_slides, rehearsal_notes } =
    await request.json()

  if (!track_id || !title) return NextResponse.json({ error: 'track_id와 title은 필수입니다.' }, { status: 400 })

  const { data: track } = await supabaseAdmin
    .from('tracks')
    .select('is_common')
    .eq('id', track_id)
    .single()

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .insert({
      track_id,
      title,
      speaker: speaker || null,
      company: company || '',
      category: category || '',
      planned_start_at: planned_start_at || null,
      planned_end_at: planned_end_at || null,
      total_slides: total_slides ?? 0,
      rehearsal_notes: rehearsal_notes || null,
      status: 'ready',
      chair_count: track?.is_common ? 300 : 80,
      pin_mic_count: 2,
      hand_mic_count: 2,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
