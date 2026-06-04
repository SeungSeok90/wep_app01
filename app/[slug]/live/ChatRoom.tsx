'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { WebinarChat } from '@/lib/types'

export default function ChatRoom({
  eventId,
  channelId,
  onNameSet,
}: {
  eventId: string
  channelId?: string
  onNameSet?: (name: string) => void
}) {
  const [messages, setMessages] = useState<WebinarChat[]>([])
  const [userName, setUserName] = useState('')
  const [nameSet, setNameSet] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 채널 변경 시 메시지 초기화 후 재로드
  useEffect(() => {
    setMessages([])
    let query = supabase
      .from('webinar_chats')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (channelId) {
      query = query.eq('channel_id', channelId)
    } else {
      query = query.is('channel_id', null)
    }

    query.then(({ data }) => { if (data) setMessages(data) })
  }, [eventId, channelId])

  // Realtime 구독 (채널별)
  useEffect(() => {
    const filter = channelId
      ? `event_id=eq.${eventId},channel_id=eq.${channelId}`
      : `event_id=eq.${eventId}`

    const channel = supabase
      .channel(`chat:${eventId}:${channelId ?? 'main'}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'webinar_chats', filter },
        (payload) => setMessages((prev) => [...prev, payload.new as WebinarChat])
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId, channelId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || sending) return
    setSending(true)
    await supabase.from('webinar_chats').insert({
      event_id: eventId,
      channel_id: channelId ?? null,
      user_name: userName,
      message: input.trim(),
    })
    setInput('')
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!nameSet) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 p-6">
        <p className="text-sm font-medium text-slate-300">채팅에 참여할 이름을 입력해 주세요</p>
        <input
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && userName.trim()) { setNameSet(true); onNameSet?.(userName.trim()) } }}
          placeholder="이름 입력"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => { if (userName.trim()) { setNameSet(true); onNameSet?.(userName.trim()) } }}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg transition-colors"
        >
          참여하기
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">실시간 채팅</span>
        <span className="text-xs text-slate-400">{userName}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-center text-slate-500 text-xs mt-8">첫 번째 채팅을 입력해 보세요!</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.user_name === userName ? 'items-end' : 'items-start'}`}>
            <span className="text-xs text-slate-500 mb-1">{msg.user_name}</span>
            <div className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] break-words ${
              msg.user_name === userName
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-slate-700 text-slate-100 rounded-tl-sm'
            }`}>
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-slate-700 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지 입력..."
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          전송
        </button>
      </div>
    </div>
  )
}
