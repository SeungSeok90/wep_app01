import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import ConsoleClient from './ConsoleClient'
import type { TrackWithSessions } from '@/lib/types'

interface Props {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ConsoleEventPage({ params, searchParams }: Props) {
  const { eventId } = await params
  const { tab } = await searchParams

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
      initialTab={tab === 'overview' ? 'overview' : 'setup'}
    />
  )
}
