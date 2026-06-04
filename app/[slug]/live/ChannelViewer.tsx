'use client'

import { useState } from 'react'
import type { EventChannel } from '@/lib/types'
import VideoPlayer from '@/app/components/VideoPlayer'
import ChatRoom from './ChatRoom'
import SessionTracker from './SessionTracker'

export default function ChannelViewer({ eventId, channels }: { eventId: string; channels: EventChannel[] }) {
  const [activeId, setActiveId] = useState(channels[0]?.id ?? '')
  const [userName, setUserName] = useState('')
  const [activeView, setActiveView] = useState<'video' | 'chat'>('video')
  const activeChannel = channels.find((c) => c.id === activeId) ?? channels[0]

  return (
    <div className="flex flex-col h-full">
      {userName && <SessionTracker eventId={eventId} channelId={activeId} userName={userName} />}

      {/* 채널 탭 */}
      <div className="flex gap-1 px-3 lg:px-4 pt-2 pb-0 border-b border-slate-700 overflow-x-auto shrink-0">
        {channels.map((ch) => (
          <button key={ch.id} onClick={() => setActiveId(ch.id)}
            className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
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
        <p className="text-xs text-slate-400 px-4 lg:px-6 py-2 border-b border-slate-700 shrink-0">{activeChannel.description}</p>
      )}

      {/* 모바일: 영상/채팅 탭 */}
      <div className="flex lg:hidden border-b border-slate-700 shrink-0">
        {(['video', 'chat'] as const).map((v) => (
          <button key={v} onClick={() => setActiveView(v)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeView === v ? 'text-white border-b-2 border-indigo-400' : 'text-slate-400'
            }`}
          >
            {v === 'video' ? '📺 영상' : '💬 채팅'}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 영상 */}
        <div className={`flex-1 p-4 lg:p-6 flex flex-col justify-center overflow-y-auto ${activeView !== 'video' ? 'hidden lg:flex' : 'flex'}`}>
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

        {/* 채팅 */}
        <div className={`lg:w-80 lg:border-l border-slate-700 bg-slate-800 flex flex-col ${activeView !== 'chat' ? 'hidden lg:flex' : 'flex w-full'}`}>
          <ChatRoom eventId={eventId} channelId={activeId} onNameSet={setUserName} />
        </div>
      </div>
    </div>
  )
}
