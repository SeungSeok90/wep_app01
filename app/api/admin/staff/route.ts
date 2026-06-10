import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

// 담당자 목록 조회
export async function GET() {
  const adminUser = await getAdminUser()
  if (adminUser?.role !== 'super') return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { data, error } = await supabase
    .from('admin_users')
    .select('*, event_staff(event_id, events(id, name))')
    .eq('role', 'staff')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// 담당자 계정 생성
export async function POST(request: Request) {
  const adminUser = await getAdminUser()
  if (adminUser?.role !== 'super') return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { email, name, password } = await request.json()
  if (!email || !password) return NextResponse.json({ error: '이메일과 비밀번호는 필수입니다.' }, { status: 400 })

  // Supabase Auth 유저 생성
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // admin_users 레코드 생성
  const { data, error } = await supabase
    .from('admin_users')
    .insert({ id: authData.user.id, email, name: name || null, role: 'staff' })
    .select()
    .single()

  if (error) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
