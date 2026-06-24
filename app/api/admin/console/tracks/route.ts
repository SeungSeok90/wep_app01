import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { event_id, name, sort_order } = await request.json()
  if (!event_id || !name) return NextResponse.json({ error: 'event_id와 name은 필수입니다.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('tracks')
    .insert({ event_id, name, sort_order: sort_order ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
