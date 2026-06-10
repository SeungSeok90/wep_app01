import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const attendanceType = searchParams.get('attendance_type') // 'offline' | 'online' | null
  const checkin = searchParams.get('checkin') // 'checked' | 'unchecked' | null

  let query = supabase
    .from('registrations')
    .select('*')
    .eq('event_id', id)
    .order('registered_at', { ascending: false })

  if (q) {
    query = query.or(`name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%`)
  }
  if (attendanceType) {
    query = query.eq('attendance_type', attendanceType)
  }
  if (checkin === 'checked') {
    query = query.not('checked_in_at', 'is', null)
  } else if (checkin === 'unchecked') {
    query = query.is('checked_in_at', null)
  }

  const { data, error } = await query.limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
