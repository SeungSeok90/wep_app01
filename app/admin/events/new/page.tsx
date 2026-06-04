'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [eventType, setEventType] = useState<'offline' | 'online'>('offline')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

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

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? '저장 실패')
      setLoading(false)
      return
    }

    const event = await res.json()
    router.push(`/admin/events/${event.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex">
        <aside className="w-56 min-h-screen bg-slate-900 text-white flex flex-col">
          <div className="px-6 py-5 border-b border-slate-700">
            <span className="font-bold text-lg">등록 플랫폼</span>
            <span className="ml-2 text-xs bg-indigo-600 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <nav className="flex flex-col gap-1 p-4 flex-1">
            <a href="/admin" className="px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              행사 관리
            </a>
          </nav>
        </aside>

        <main className="flex-1 p-8 max-w-2xl">
          <div className="mb-6">
            <a href="/admin" className="text-slate-400 hover:text-slate-600 text-sm">← 목록으로</a>
            <h1 className="text-2xl font-bold mt-2">새 행사 만들기</h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
            {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

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
                <input name="eventName" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">URL 슬러그 *</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">도메인/</span>
                  <input name="slug" required placeholder="event-name" className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <p className="text-xs text-slate-400 mt-1">영문, 숫자, 하이픈만 사용 가능</p>
              </div>

              {eventType === 'offline' ? (
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">행사 장소</label>
                  <input name="location" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ) : (
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">영상 URL (YouTube 또는 Vimeo)</label>
                  <input name="video_url" placeholder="https://youtube.com/... 또는 https://vimeo.com/..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <p className="text-xs text-slate-400 mt-1">나중에 입력해도 됩니다</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">행사 일시</label>
                <input name="event_date" type="datetime-local" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">주관사 담당자</label>
                <input name="organizer" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">등록 타겟 인원</label>
                <input name="target_count" type="number" min="1" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div />
              <div>
                <label className="block text-sm font-medium mb-1">등록 시작일시</label>
                <input name="register_start" type="datetime-local" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">등록 마감일시</label>
                <input name="register_end" type="datetime-local" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-6 py-2 rounded-lg transition-colors">
                {loading ? '저장 중...' : '저장 후 상세 설정 →'}
              </button>
              <a href="/admin" className="text-slate-500 hover:text-slate-700 text-sm px-4 py-2 rounded-lg transition-colors">취소</a>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
