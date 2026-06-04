import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { count } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id)
    .not('checked_in_at', 'is', null)

  return NextResponse.json({ count: count ?? 0 })
}
