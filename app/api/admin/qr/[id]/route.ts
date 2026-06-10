import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// QR 수정 (이름, 대상 URL, 설명, 활성화 여부)
export async function PUT(request: Request, { params }: Params) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const allowed = ['name', 'target_url', 'description', 'is_active'] as const
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (updates.target_url) {
    try { new URL(updates.target_url as string) } catch {
      return NextResponse.json({ error: '유효한 URL 형식이 아닙니다.' }, { status: 400 })
    }
  }

  const { data, error } = await supabaseAdmin
    .from('qr_codes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// QR 삭제
export async function DELETE(_req: Request, { params }: Params) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id } = await params
  const { error } = await supabaseAdmin.from('qr_codes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
