import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string; channelId: string }> }

export async function PUT(request: Request, { params }: Params) {
  const { channelId } = await params
  const body = await request.json()
  const { data, error } = await supabase
    .from('event_channels')
    .update(body)
    .eq('id', channelId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { channelId } = await params
  const { error } = await supabase.from('event_channels').delete().eq('id', channelId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
