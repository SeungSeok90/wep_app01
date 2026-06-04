import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [{ count: total }, { count: checkedIn }] = await Promise.all([
    supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', id),
    supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', id).not('checked_in_at', 'is', null),
  ])

  return NextResponse.json({
    total: total ?? 0,
    checked_in: checkedIn ?? 0,
    not_checked_in: (total ?? 0) - (checkedIn ?? 0),
  })
}
