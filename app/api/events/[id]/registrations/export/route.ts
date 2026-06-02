import { supabase } from '@/lib/supabase'
import type { EventField, Registration } from '@/lib/types'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: event } = await supabase
    .from('events')
    .select('name, event_fields(*)')
    .eq('id', id)
    .single()

  if (!event) return new Response('Not found', { status: 404 })

  const { data: registrations } = await supabase
    .from('registrations')
    .select('*')
    .eq('event_id', id)
    .order('registered_at', { ascending: true })

  const fields: EventField[] = (event.event_fields ?? []).sort(
    (a: EventField, b: EventField) => a.sort_order - b.sort_order
  )

  const baseHeaders = ['등록일시', '이름', '이메일', '연락처', '회사명', '부서', '직급']
  const customHeaders = fields.map((f) => f.label)
  const headers = [...baseHeaders, ...customHeaders]

  const rows = (registrations ?? []).map((r: Registration) => {
    const base = [
      new Date(r.registered_at).toLocaleString('ko-KR'),
      r.name,
      r.email,
      r.phone ?? '',
      r.company ?? '',
      r.department ?? '',
      r.position ?? '',
    ]
    const custom = fields.map((f) => {
      const answer = r.custom_answers?.[f.label]
      return Array.isArray(answer) ? answer.join(', ') : (answer ?? '')
    })
    return [...base, ...custom].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
  })

  const csv = '﻿' + [headers.join(','), ...rows].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(event.name)}_참가자목록.csv"`,
    },
  })
}
