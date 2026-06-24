import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ sessionId: string }> }

export async function PUT(request: Request, { params }: Params) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { sessionId } = await params
  const body = await request.json()

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .update(body)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { sessionId } = await params

  const { error } = await supabaseAdmin.from('sessions').delete().eq('id', sessionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
