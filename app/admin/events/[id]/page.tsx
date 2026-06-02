import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import EventEditForm from './EventEditForm'

export default async function EventEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: event, error } = await supabase
    .from('events')
    .select('*, event_fields(*)')
    .eq('id', id)
    .single()

  if (error || !event) notFound()

  const fields = (event.event_fields ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  )

  return <EventEditForm event={event} fields={fields} />
}
