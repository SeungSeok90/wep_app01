import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import type { NametagTemplate, Registration } from '@/lib/types'
import { DEFAULT_NAMETAG_TEMPLATE } from '@/lib/types'
import PrintNametagsClient from './PrintNametagsClient'

export default async function PrintNametagsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: event, error } = await supabase
    .from('events')
    .select('id, name, nametag_template')
    .eq('id', id)
    .single()

  if (error || !event) notFound()

  const { data: registrations } = await supabase
    .from('registrations')
    .select('*')
    .eq('event_id', id)
    .order('registered_at', { ascending: true })

  const template: NametagTemplate = event.nametag_template ?? DEFAULT_NAMETAG_TEMPLATE

  return (
    <PrintNametagsClient
      event={event}
      registrations={(registrations ?? []) as Registration[]}
      template={template}
    />
  )
}
