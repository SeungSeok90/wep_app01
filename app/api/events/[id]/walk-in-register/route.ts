import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('registrations')
    .insert({
      event_id: id,
      name: body.name,
      email: body.email || `walkin-${Date.now()}@onsite.local`,
      phone: body.phone || null,
      company: body.company || null,
      department: body.department || null,
      position: body.position || null,
      attendance_type: 'offline',
      custom_answers: { _walk_in: 'true' },
      checked_in_at: now,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
