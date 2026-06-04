'use client'

import { useEffect, useRef } from 'react'

const HEARTBEAT_INTERVAL = 30_000 // 30초

export default function SessionTracker({
  eventId,
  channelId,
  userName,
}: {
  eventId: string
  channelId?: string
  userName: string
}) {
  const sessionIdRef = useRef<string | null>(null)
  const prevChannelRef = useRef<string | undefined>(channelId)

  // 세션 생성
  useEffect(() => {
    if (!userName) return

    async function createSession() {
      const res = await fetch('/api/live-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, channel_id: channelId ?? null, user_name: userName }),
      })
      const data = await res.json()
      sessionIdRef.current = data.id
    }

    createSession()

    // 탭 닫기 / 이탈 시 퇴장 처리
    function handleLeave() {
      if (!sessionIdRef.current) return
      navigator.sendBeacon(
        `/api/live-sessions/${sessionIdRef.current}`,
        JSON.stringify({ action: 'leave' })
      )
    }

    window.addEventListener('beforeunload', handleLeave)
    return () => {
      window.removeEventListener('beforeunload', handleLeave)
      handleLeave()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName])

  // 채널 변경 감지
  useEffect(() => {
    if (!sessionIdRef.current || prevChannelRef.current === channelId) return
    prevChannelRef.current = channelId

    fetch(`/api/live-sessions/${sessionIdRef.current}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'channel_change', channel_id: channelId ?? null }),
    })
  }, [channelId])

  // 하트비트 (30초마다)
  useEffect(() => {
    if (!userName) return

    const timer = setInterval(() => {
      if (!sessionIdRef.current) return
      fetch(`/api/live-sessions/${sessionIdRef.current}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'heartbeat' }),
      })
    }, HEARTBEAT_INTERVAL)

    return () => clearInterval(timer)
  }, [userName])

  return null
}
