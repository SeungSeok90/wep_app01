import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ConsoleClient from './ConsoleClient'
import type { TrackWithSessions } from '@/lib/types'

export default async function ConsoleEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params

  const { data: event } = await supabase
    .from('events')
    .select('id, name, event_date')
    .eq('id', eventId)
    .single()

  if (!event) notFound()

  const { data: tracks } = await supabase
    .from('tracks')
    .select('*, sessions(*)')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true })

  const tracksWithSessions: TrackWithSessions[] = (tracks ?? []).map((t) => ({
    ...t,
    sessions: (t.sessions ?? []).sort(
      (a: { planned_start_at: string | null }, b: { planned_start_at: string | null }) => {
        if (!a.planned_start_at) return 1
        if (!b.planned_start_at) return -1
        return new Date(a.planned_start_at).getTime() - new Date(b.planned_start_at).getTime()
      }
    ),
  }))

  return (
    <ConsoleClient
      event={event}
      initialTracks={tracksWithSessions}
    />
  )
}
