import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import type { EventChannel } from '@/lib/types'
import VideoPlayer from '@/app/components/VideoPlayer'
import ChatRoom from './ChatRoom'
import ChannelViewer from './ChannelViewer'

export default async function LivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: event, error } = await supabase
    .from('events')
    .select('id, name, slug, type, video_url, event_date, organizer')
    .eq('slug', slug)
    .single()

  if (error || !event) notFound()
  if (event.type === 'offline') notFound()

  const { data: channels } = await supabase
    .from('event_channels')
    .select('*')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true })

  const hasChannels = channels && channels.length > 0

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* 헤더 */}
      <header className="border-b border-slate-700 px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-bold text-base">{event.name}</h1>
          {event.event_date && (
            <p className="text-slate-400 text-xs mt-0.5">
              {new Date(event.event_date).toLocaleString('ko-KR')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasChannels && (
            <span className="text-xs text-slate-400">{channels.length}개 채널</span>
          )}
          <span className="flex items-center gap-1.5 text-xs bg-red-500 px-3 py-1 rounded-full font-medium">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </span>
        </div>
      </header>

      {/* 본문 */}
      <div className="flex-1 overflow-hidden">
        {hasChannels ? (
          // 멀티 채널 뷰
          <ChannelViewer eventId={event.id} channels={channels as EventChannel[]} />
        ) : (
          // 단일 채널 뷰 (채널 없을 때)
          <div className="flex h-full">
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
              <ChatRoom eventId={event.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
