'use client'

import { useState } from 'react'
import VideoPlayer from '@/app/components/VideoPlayer'
import ChatRoom from './ChatRoom'
import SessionTracker from './SessionTracker'

export default function SingleLiveView({
  event,
}: {
  event: { id: string; video_url: string | null; organizer: string | null }
}) {
  const [userName, setUserName] = useState('')

  return (
    <div className="flex h-full">
      {userName && <SessionTracker eventId={event.id} userName={userName} />}

      <div className="flex-1 p-6 flex flex-col justify-center">
        {event.video_url ? (
          <VideoPlayer url={event.video_url} />
        ) : (
          <div className="w-full aspect-video bg-slate-800 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 text-lg mb-2">영상 준비 중입니다</p>
              <p className="text-slate-500 text-sm">잠시 후 시작됩니다</p>
            </div>
          </div>
        )}
        {event.organizer && (
          <p className="text-slate-400 text-sm mt-4">주관: {event.organizer}</p>
        )}
      </div>

      <div className="w-80 border-l border-slate-700 bg-slate-800 flex flex-col">
        <ChatRoom eventId={event.id} onNameSet={setUserName} />
      </div>
    </div>
  )
}
