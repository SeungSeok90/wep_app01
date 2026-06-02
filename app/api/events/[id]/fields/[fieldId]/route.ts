import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string; fieldId: string }> }

export async function PUT(request: Request, { params }: Params) {
  const { fieldId } = await params
  const body = await request.json()
  const { data, error } = await supabase
    .from('event_fields')
    .update(body)
    .eq('id', fieldId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { fieldId } = await params
  const { error } = await supabase.from('event_fields').delete().eq('id', fieldId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
