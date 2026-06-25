import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string; templateId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { templateId } = await params
  const { data, error } = await supabaseAdmin
    .from('message_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: Request, { params }: Params) {
  const { templateId } = await params
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('message_templates')
    .update({ name: body.name, subject: body.subject, body_html: body.body_html })
    .eq('id', templateId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { templateId } = await params

  // 기본 템플릿은 삭제 불가
  const { data: tpl } = await supabaseAdmin
    .from('message_templates')
    .select('is_default')
    .eq('id', templateId)
    .single()

  if (tpl?.is_default) {
    return NextResponse.json({ error: '기본 템플릿은 삭제할 수 없습니다.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('message_templates')
    .delete()
    .eq('id', templateId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
