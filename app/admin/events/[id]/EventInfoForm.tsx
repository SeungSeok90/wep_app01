'use client'

import { useState } from 'react'
import type { Event } from '@/lib/types'

type EventType = 'offline' | 'online' | 'hybrid'

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'offline', label: '🏢 오프라인' },
  { value: 'online', label: '🌐 온라인' },
  { value: 'hybrid', label: '🔀 하이브리드' },
]

// datetime-local 값(타임존 정보 없음)을 브라우저 로컬 시간 기준으로 해석해 UTC ISO 문자열로 변환.
// 그대로 저장하면 Postgres가 UTC로 오인해 9시간(KST 오프셋)이 밀린다.
function toIsoOrNull(localDatetime: string): string | null {
  if (!localDatetime) return null
  return new Date(localDatetime).toISOString()
}

// 저장된 UTC ISO 문자열을 datetime-local input에 채울 로컬(KST) 시각 문자열로 변환.
// .slice(0, 16)으로 그냥 잘라 쓰면 UTC 시각 숫자를 그대로 보여줘서 9시간 어긋나 보인다.
function toLocalDatetime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EventInfoForm({ event }: { event: Event }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [eventType, setEventType] = useState<EventType>(event.type ?? 'offline')

  const isOffline = eventType === 'offline' || eventType === 'hybrid'
  const isOnline = eventType === 'online' || eventType === 'hybrid'

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
      location: isOffline ? (form.location.value || null) : null,
      video_url: isOnline ? (form.video_url.value || null) : null,
      offline_capacity: isOffline && form.offline_capacity.value ? Number(form.offline_capacity.value) : null,
      online_capacity: isOnline && form.online_capacity.value ? Number(form.online_capacity.value) : null,
      event_date: toIsoOrNull(form.event_date.value),
      organizer: form.organizer.value || null,
      register_start: toIsoOrNull(form.register_start.value),
      register_end: toIsoOrNull(form.register_end.value),
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
          <div className="flex gap-2">
            {EVENT_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setEventType(value)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  eventType === value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {label}
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

        {/* 오프라인 필드 */}
        {isOffline && (
          <>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">행사 장소</label>
              <input name="location" defaultValue={event.location ?? ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">현장 정원</label>
              <input name="offline_capacity" type="number" min="1" defaultValue={event.offline_capacity ?? event.target_count ?? ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </>
        )}

        {/* 온라인 필드 */}
        {isOnline && (
          <>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">영상 URL (YouTube 또는 Vimeo)</label>
              <input name="video_url" defaultValue={event.video_url ?? ''} placeholder="https://youtube.com/... 또는 https://vimeo.com/..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {event.video_url && (
                <p className="text-xs text-indigo-500 mt-1">
                  라이브 페이지: <a href={`/${event.slug}/live`} target="_blank" className="underline">/{event.slug}/live</a>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">온라인 정원</label>
              <input name="online_capacity" type="number" min="1" defaultValue={event.online_capacity ?? ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </>
        )}

        {/* 하이브리드일 때 빈 칸 채우기 */}
        {eventType === 'hybrid' && <div />}

        <div>
          <label className="block text-sm font-medium mb-1">행사 일시</label>
          <input name="event_date" type="datetime-local" defaultValue={toLocalDatetime(event.event_date)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">주관사 담당자</label>
          <input name="organizer" defaultValue={event.organizer ?? ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">등록 시작일시</label>
          <input name="register_start" type="datetime-local" defaultValue={toLocalDatetime(event.register_start)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">등록 마감일시</label>
          <input name="register_end" type="datetime-local" defaultValue={toLocalDatetime(event.register_end)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
