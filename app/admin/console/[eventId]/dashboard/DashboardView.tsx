'use client'

import Link from 'next/link'
import { ChevronLeft, Clock, Monitor } from 'lucide-react'
import { useConsoleSync } from '@/app/admin/console/_components/useConsoleSync'
import { computeKpis } from '@/lib/session-logic'
import KpiBar from '@/app/admin/console/_components/KpiBar'
import MorningTimeline from '@/app/admin/console/_components/MorningTimeline'
import TrackGrid from '@/app/admin/console/_components/TrackGrid'
import { RealtimeStatusBadge, DisconnectedBanner } from '@/app/components/RealtimeStatus'
import type { Track, TrackWithSessions } from '@/lib/types'

interface Event { id: string; name: string; event_date: string | null }
interface Props { event: Event; initialTracks: TrackWithSessions[] }

function toTrack(t: TrackWithSessions): Track {
  return { id: t.id, event_id: t.event_id, name: t.name, sort_order: t.sort_order, is_common: t.is_common, created_at: t.created_at }
}

export default function DashboardView({ event, initialTracks }: Props) {
  const { tracks, sessions, now, connStatus } = useConsoleSync(event.id, initialTracks)

  const commonTracks: Track[] = tracks.filter((t) => t.is_common).map(toTrack)
  const otherTracks: Track[] = tracks.filter((t) => !t.is_common).map(toTrack)
  const commonIds = new Set(commonTracks.map((t) => t.id))

  const morning = sessions.filter((s) => commonIds.has(s.track_id))
  const afternoon = sessions.filter((s) => !commonIds.has(s.track_id))
  const kpis = computeKpis(sessions, now)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/console/${event.id}/live`} className="text-slate-400 hover:text-slate-700 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Monitor className="w-5 h-5 text-slate-500" />
          <div>
            <h1 className="font-bold text-base text-slate-900">{event.name}</h1>
            {event.event_date && (
              <p className="text-slate-400 text-xs">{new Date(event.event_date).toLocaleString('ko-KR')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <RealtimeStatusBadge status={connStatus} />
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm tabular-nums">
              {now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </header>

      <DisconnectedBanner status={connStatus} />

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-6">
          <KpiBar kpis={kpis} />
        </div>

        <div className="flex flex-col gap-6">
          {tracks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
              <Monitor className="w-12 h-12 opacity-30" />
              <p>트랙이 없습니다.</p>
            </div>
          )}
          {morning.length > 0 && <MorningTimeline sessions={morning} />}
          {afternoon.length > 0 && <TrackGrid sessions={afternoon} tracks={otherTracks} />}
        </div>
      </main>
    </div>
  )
}
