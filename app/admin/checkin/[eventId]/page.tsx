import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import CheckinClient from './CheckinClient'

export default async function CheckinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params

  const { data: event, error } = await supabase
    .from('events')
    .select('id, name, slug, event_date, event_fields(*)')
    .eq('id', eventId)
    .single()

  if (error || !event) notFound()

  return <CheckinClient event={event} />
}
