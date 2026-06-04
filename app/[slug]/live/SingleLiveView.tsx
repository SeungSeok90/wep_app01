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
  const [activeView, setActiveView] = useState<'video' | 'chat'>('video')

  return (
    <div className="flex flex-col h-full">
      {userName && <SessionTracker eventId={event.id} userName={userName} />}

      {/* 모바일: 탭 전환 */}
      <div className="flex lg:hidden border-b border-slate-700 shrink-0">
        {(['video', 'chat'] as const).map((v) => (
          <button key={v} onClick={() => setActiveView(v)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeView === v ? 'text-white border-b-2 border-indigo-400' : 'text-slate-400'
            }`}
          >
            {v === 'video' ? '📺 영상' : '💬 채팅'}
          </button>
        ))}
      </div>

      {/* 데스크탑: 좌우 / 모바일: 탭 기반 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 영상 */}
        <div className={`flex-1 p-4 lg:p-6 flex flex-col justify-center ${activeView !== 'video' ? 'hidden lg:flex' : 'flex'}`}>
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
          {event.organizer && <p className="text-slate-400 text-sm mt-4">주관: {event.organizer}</p>}
        </div>

        {/* 채팅 */}
        <div className={`lg:w-80 lg:border-l border-slate-700 bg-slate-800 flex flex-col ${activeView !== 'chat' ? 'hidden lg:flex' : 'flex w-full'}`}>
          <ChatRoom eventId={event.id} onNameSet={setUserName} />
        </div>
      </div>
    </div>
  )
}
