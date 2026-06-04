'use client'

import { useState } from 'react'
import type { EventChannel } from '@/lib/types'
import VideoPlayer from '@/app/components/VideoPlayer'
import ChatRoom from './ChatRoom'
import SessionTracker from './SessionTracker'

export default function ChannelViewer({
  eventId,
  channels,
}: {
  eventId: string
  channels: EventChannel[]
}) {
  const [activeId, setActiveId] = useState(channels[0]?.id ?? '')
  const [userName, setUserName] = useState('')
  const activeChannel = channels.find((c) => c.id === activeId) ?? channels[0]

  return (
    <div className="flex flex-col h-full">
      {/* SessionTracker: 이름 확정 후 추적 시작 */}
      {userName && (
        <SessionTracker eventId={eventId} channelId={activeId} userName={userName} />
      )}

      {/* 채널 탭 */}
      <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-slate-700 overflow-x-auto shrink-0">
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setActiveId(ch.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
              activeId === ch.id
                ? 'bg-slate-800 text-white border border-b-0 border-slate-600'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {ch.name}
          </button>
        ))}
      </div>

      {activeChannel?.description && (
        <p className="text-xs text-slate-400 px-6 py-2 border-b border-slate-700 shrink-0">
          {activeChannel.description}
        </p>
      )}

      {/* 영상 + 채팅 */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6 flex flex-col justify-center overflow-y-auto">
          {activeChannel?.video_url ? (
            <VideoPlayer url={activeChannel.video_url} />
          ) : (
            <div className="w-full aspect-video bg-slate-800 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <p className="text-slate-400 text-lg mb-2">영상 준비 중입니다</p>
                <p className="text-slate-500 text-sm">잠시 후 시작됩니다</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-80 border-l border-slate-700 bg-slate-800 flex flex-col">
          <ChatRoom
            eventId={eventId}
            channelId={activeId}
            onNameSet={setUserName}
          />
        </div>
      </div>
    </div>
  )
}
