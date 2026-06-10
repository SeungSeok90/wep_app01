'use client'

import { useEffect } from 'react'

export default function ViewTracker({ eventId }: { eventId: string }) {
  useEffect(() => {
    fetch(`/api/events/${eventId}/track-view`, { method: 'POST' }).catch(() => {})
  }, [eventId])

  return null
}
