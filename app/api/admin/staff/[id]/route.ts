import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// 담당자 삭제
export async function DELETE(_req: Request, { params }: Params) {
  const adminUser = await getAdminUser()
  if (adminUser?.role !== 'super') return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { id } = await params

  await supabaseAdmin.from('admin_users').delete().eq('id', id)
  await supabaseAdmin.auth.admin.deleteUser(id)

  return NextResponse.json({ success: true })
}
