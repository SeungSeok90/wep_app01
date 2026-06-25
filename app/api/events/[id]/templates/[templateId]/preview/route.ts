import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string; templateId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { templateId } = await params
  const { data, error } = await supabaseAdmin
    .from('message_templates')
    .select('body_html')
    .eq('id', templateId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return new NextResponse(data.body_html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
