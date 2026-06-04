'use client'

import { useState } from 'react'
import type { Event, EventChannel } from '@/lib/types'

export default function ChannelsManager({
  event,
  channels: initialChannels,
}: {
  event: Event
  channels: EventChannel[]
}) {
  const [channels, setChannels] = useState<EventChannel[]>(initialChannels)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', video_url: '' })

  async function handleAdd() {
    if (!form.name.trim()) return
    const res = await fetch(`/api/events/${event.id}/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, sort_order: channels.length }),
    })
    const created = await res.json()
    setChannels([...channels, created])
    setForm({ name: '', description: '', video_url: '' })
    setAdding(false)
  }

  async function handleUpdate(channelId: string) {
    const res = await fetch(`/api/events/${event.id}/channels/${channelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const updated = await res.json()
    setChannels(channels.map((c) => (c.id === channelId ? updated : c)))
    setEditingId(null)
  }

  async function handleDelete(channelId: string) {
    if (!confirm('이 채널을 삭제할까요?')) return
    await fetch(`/api/events/${event.id}/channels/${channelId}`, { method: 'DELETE' })
    setChannels(channels.filter((c) => c.id !== channelId))
  }

  function startEdit(channel: EventChannel) {
    setEditingId(channel.id)
    setForm({ name: channel.name, description: channel.description ?? '', video_url: channel.video_url ?? '' })
  }

  const isOnlineType = event.type === 'online' || event.type === 'hybrid'

  return (
    <div className="max-w-2xl">
      {!isOnlineType && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-700">
          채널은 온라인 또는 하이브리드 행사에서만 사용됩니다. 행사 유형을 변경해 주세요.
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-semibold text-base">채널 (트랙) 관리</h2>
            <p className="text-xs text-slate-400 mt-0.5">채널이 없으면 단일 영상으로 송출됩니다</p>
          </div>
          <button
            onClick={() => { setAdding(true); setForm({ name: '', description: '', video_url: '' }) }}
            className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            + 채널 추가
          </button>
        </div>

        {/* 라이브 페이지 링크 */}
        <a
          href={`/${event.slug}/live`}
          target="_blank"
          className="inline-block text-xs text-indigo-500 hover:underline mb-4"
        >
          라이브 페이지 미리보기 →
        </a>

        {channels.length === 0 && !adding && (
          <p className="text-slate-400 text-sm text-center py-8">
            채널이 없습니다. 멀티 트랙 운영 시 채널을 추가하세요.
          </p>
        )}

        <div className="flex flex-col gap-3 mb-4">
          {channels.map((channel, idx) => (
            <div key={channel.id} className="border border-slate-200 rounded-lg p-4">
              {editingId === channel.id ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-4">{idx + 1}</span>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="채널명"
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="설명 (선택)"
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="영상 URL (YouTube 또는 Vimeo)"
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(channel.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">저장</button>
                    <button onClick={() => setEditingId(null)} className="text-slate-500 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">취소</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-slate-400 mt-0.5 w-4">{idx + 1}</span>
                    <div>
                      <p className="font-medium text-sm">{channel.name}</p>
                      {channel.description && <p className="text-xs text-slate-400 mt-0.5">{channel.description}</p>}
                      {channel.video_url ? (
                        <p className="text-xs text-indigo-500 mt-0.5 truncate max-w-xs">{channel.video_url}</p>
                      ) : (
                        <p className="text-xs text-amber-500 mt-0.5">영상 URL 없음</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button onClick={() => startEdit(channel)} className="text-slate-400 hover:text-slate-700 text-xs transition-colors">편집</button>
                    <button onClick={() => handleDelete(channel.id)} className="text-red-400 hover:text-red-600 text-xs transition-colors">삭제</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {adding && (
          <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-4 flex flex-col gap-3">
            <p className="text-xs font-medium text-indigo-700">새 채널</p>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="채널명 (예: Track A - AI 세션)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="설명 (선택)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              placeholder="영상 URL (YouTube 또는 Vimeo)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">추가</button>
              <button onClick={() => setAdding(false)} className="text-slate-500 text-sm px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">취소</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
