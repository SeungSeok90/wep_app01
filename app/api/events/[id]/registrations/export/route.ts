import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
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

  const headers = ['등록일시', '이름', '이메일', '연락처', '회사명', '부서', '직급', ...fields.map((f) => f.label)]

  const rows = (registrations ?? []).map((r: Registration) => {
    const custom = fields.map((f) => {
      const answer = r.custom_answers?.[f.label]
      return Array.isArray(answer) ? answer.join(', ') : (answer ?? '')
    })
    return [
      new Date(r.registered_at).toLocaleString('ko-KR'),
      r.name,
      r.email,
      r.phone ?? '',
      r.company ?? '',
      r.department ?? '',
      r.position ?? '',
      ...custom,
    ]
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // 컬럼 너비 자동 설정
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length * 2, 12) }))

  XLSX.utils.book_append_sheet(wb, ws, '참가자목록')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(event.name + '_참가자목록.xlsx')}`,
    },
  })
}
