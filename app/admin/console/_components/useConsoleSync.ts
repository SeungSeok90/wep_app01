'use client'

import { useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { withTiming } from '@/lib/session-logic'
import type { Session, TrackWithSessions } from '@/lib/types'
import type { ConnectionStatus } from '@/app/components/RealtimeStatus'
import type { ConsoleSession } from './types'

/**
 * 트랙/세션 데이터를 Supabase Realtime으로 동기화하고, 1초마다 now를 갱신해
 * 타이머류 파생값이 재계산되도록 하는 공용 훅. 콘솔(운영자)/대시보드(관계자) 화면이 공유한다.
 */
export function useConsoleSync(eventId: string, initialTracks: TrackWithSessions[]) {
  const [tracks, setTracks] = useState<TrackWithSessions[]>(initialTracks)
  const [now, setNow] = useState(new Date())
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('connecting')

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel(`console-sync-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const removedId = (payload.old as { id: string }).id
            setTracks((prev) => prev.map((t) => ({ ...t, sessions: t.sessions.filter((s) => s.id !== removedId) })))
            return
          }
          const row = payload.new as Session
          setTracks((prev) => {
            // 기존 소속에서 제거 후, row.track_id에 최신 데이터로 삽입 (INSERT/UPDATE/트랙 이동 모두 처리)
            const stripped = prev.map((t) => ({ ...t, sessions: t.sessions.filter((s) => s.id !== row.id) }))
            return stripped.map((t) => (t.id === row.track_id ? { ...t, sessions: [...t.sessions, row] } : t))
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnStatus('connected')
        else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setConnStatus('disconnected')
        else setConnStatus('connecting')
      })

    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  const sessions: ConsoleSession[] = useMemo(() => {
    const trackNameById = new Map(tracks.map((t) => [t.id, t.name]))
    const flatSessions = tracks.flatMap((t) => t.sessions)
    return withTiming(flatSessions, now).map((s) => ({ ...s, track_name: trackNameById.get(s.track_id) ?? '' }))
  }, [tracks, now])

  return { tracks, setTracks, sessions, now, connStatus }
}
