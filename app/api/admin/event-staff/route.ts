import { supabase } from '@/lib/supabase'
import { getAdminUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

// 행사-담당자 배정
export async function POST(request: Request) {
  const adminUser = await getAdminUser()
  if (adminUser?.role !== 'super') return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { event_id, user_id } = await request.json()
  if (!event_id || !user_id) return NextResponse.json({ error: '필수 값이 없습니다.' }, { status: 400 })

  const { data, error } = await supabase
    .from('event_staff')
    .insert({ event_id, user_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// 행사-담당자 배정 해제
export async function DELETE(request: Request) {
  const adminUser = await getAdminUser()
  if (adminUser?.role !== 'super') return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { event_id, user_id } = await request.json()

  const { error } = await supabase
    .from('event_staff')
    .delete()
    .eq('event_id', event_id)
    .eq('user_id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
