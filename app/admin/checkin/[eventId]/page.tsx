import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import CheckinClient from './CheckinClient'

export default async function CheckinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params

  const { data: event, error } = await supabase
    .from('events')
    .select('id, name, event_date')
    .eq('id', eventId)
    .single()

  if (error || !event) notFound()

  return <CheckinClient event={event} />
}
