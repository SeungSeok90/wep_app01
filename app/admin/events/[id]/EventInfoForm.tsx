'use client'

import { useState } from 'react'
import type { Event } from '@/lib/types'

export default function EventInfoForm({ event }: { event: Event }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [eventType, setEventType] = useState<'offline' | 'online'>(event.type ?? 'offline')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    const form = e.currentTarget
    const data = {
      name: form.eventName.value,
      slug: form.slug.value,
      type: eventType,
      location: form.location.value || null,
      video_url: eventType === 'online' ? (form.video_url.value || null) : null,
      event_date: form.event_date.value || null,
      organizer: form.organizer.value || null,
      target_count: form.target_count.value ? Number(form.target_count.value) : null,
      register_start: form.register_start.value || null,
      register_end: form.register_end.value || null,
    }

    const res = await fetch(`/api/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? '저장 실패')
    } else {
      setSaved(true)
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 max-w-2xl">
      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
      {saved && <p className="text-emerald-600 text-sm bg-emerald-50 px-4 py-2 rounded-lg">저장되었습니다.</p>}

      <div className="grid grid-cols-2 gap-4">
        {/* 행사 유형 */}
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">행사 유형 *</label>
          <div className="flex gap-3">
            {(['offline', 'online'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEventType(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  eventType === t
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {t === 'offline' ? '🏢 오프라인' : '🌐 온라인 (웨비나)'}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">행사명 *</label>
          <input name="eventName" defaultValue={event.name} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">URL 슬러그 *</label>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">도메인/</span>
            <input name="slug" defaultValue={event.slug} required className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {eventType === 'offline' ? (
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">행사 장소</label>
            <input name="location" defaultValue={event.location ?? ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        ) : (
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">영상 URL (YouTube 또는 Vimeo)</label>
            <input name="video_url" defaultValue={event.video_url ?? ''} placeholder="https://youtube.com/... 또는 https://vimeo.com/..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {event.video_url && (
              <p className="text-xs text-indigo-500 mt-1">
                라이브 페이지: <a href={`/${event.slug}/live`} target="_blank" className="underline">/{event.slug}/live</a>
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">행사 일시</label>
          <input name="event_date" type="datetime-local" defaultValue={event.event_date ? event.event_date.slice(0, 16) : ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">주관사 담당자</label>
          <input name="organizer" defaultValue={event.organizer ?? ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">등록 타겟 인원</label>
          <input name="target_count" type="number" min="1" defaultValue={event.target_count ?? ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div />
        <div>
          <label className="block text-sm font-medium mb-1">등록 시작일시</label>
          <input name="register_start" type="datetime-local" defaultValue={event.register_start ? event.register_start.slice(0, 16) : ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">등록 마감일시</label>
          <input name="register_end" type="datetime-local" defaultValue={event.register_end ? event.register_end.slice(0, 16) : ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <div className="pt-2">
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-6 py-2 rounded-lg transition-colors">
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
