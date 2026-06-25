import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string; sendId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { sendId } = await params
  const { data, error } = await supabaseAdmin
    .from('message_send_logs')
    .select('id, email, status, error_message, sent_at')
    .eq('send_id', sendId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
