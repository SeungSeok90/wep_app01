'use client'

import { useState } from 'react'
import type { NametagTemplate, Registration } from '@/lib/types'
import NametagCard from '../NametagCard'

export default function PrintNametagsClient({
  event,
  registrations,
  template,
}: {
  event: { id: string; name: string }
  registrations: Registration[]
  template: NametagTemplate
}) {
  const [filter, setFilter] = useState<'all' | 'offline' | 'online' | 'checked_in' | 'not_checked_in'>('all')

  const filtered = registrations.filter((r) => {
    if (filter === 'offline') return r.attendance_type === 'offline'
    if (filter === 'online') return r.attendance_type === 'online'
    if (filter === 'checked_in') return !!r.checked_in_at
    if (filter === 'not_checked_in') return !r.checked_in_at
    return true
  })

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          .nametag-page {
            page-break-after: always;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100vw;
            height: 100vh;
          }
          .nametag-page:last-child { page-break-after: avoid; }
        }
      `}</style>

      {/* 컨트롤 바 */}
      <div className="no-print bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <a href={`/admin/events/${event.id}?tab=nametag`} className="text-slate-400 hover:text-slate-600 text-sm">
            ← 디자이너로
          </a>
          <h1 className="font-bold">{event.name} — 네임택 출력</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">전체 ({registrations.length}명)</option>
            <option value="offline">현장 참석만</option>
            <option value="online">온라인만</option>
            <option value="checked_in">출석 완료만</option>
            <option value="not_checked_in">미출석만</option>
          </select>
          <span className="text-sm text-slate-500">{filtered.length}명</span>
          <button
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-5 py-2 rounded-lg transition-colors"
          >
            🖨️ 인쇄
          </button>
        </div>
      </div>

      {/* 네임택 목록 — 화면에서는 그리드, 인쇄 시 한 장씩 */}
      <div className="no-print p-8 bg-slate-100 min-h-screen">
        <div className="flex flex-wrap gap-4 justify-start">
          {filtered.map((r) => (
            <div key={r.id} className="shadow border border-slate-200 bg-white">
              <NametagCard
                template={template}
                registration={r}
                eventName={event.name}
                qrUrl={`${baseUrl}/attend/${r.id}`}
                scale={0.8}
              />
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-slate-400 text-sm py-20 w-full text-center">해당하는 참가자가 없습니다.</p>
          )}
        </div>
      </div>

      {/* 인쇄용 — 한 명씩 한 페이지 */}
      <div className="hidden print:block">
        {filtered.map((r) => (
          <div key={r.id} className="nametag-page">
            <NametagCard
              template={template}
              registration={r}
              eventName={event.name}
              qrUrl={`${baseUrl}/attend/${r.id}`}
              forPrint
            />
          </div>
        ))}
      </div>
    </>
  )
}
