import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import CheckinClient from './CheckinClient'
import { DEFAULT_NAMETAG_TEMPLATE } from '@/lib/types'
import type { NametagTemplate } from '@/lib/types'

export default async function CheckinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params

  const { data: event, error } = await supabase
    .from('events')
    .select('id, name, slug, event_date, event_fields(*), nametag_template')
    .eq('id', eventId)
    .single()

  if (error || !event) notFound()

  const template: NametagTemplate = event.nametag_template ?? DEFAULT_NAMETAG_TEMPLATE

  return <CheckinClient event={event} template={template} />
}
