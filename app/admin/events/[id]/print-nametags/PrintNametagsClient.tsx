'use client'

import { useState } from 'react'
import type { NametagTemplate, Registration } from '@/lib/types'
import NametagPreview from '../NametagPreview'

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  4: 'grid-cols-2',
  6: 'grid-cols-3',
}

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
          .nametag-grid {
            display: grid;
            grid-template-columns: repeat(${template.per_page <= 2 ? template.per_page : template.per_page === 4 ? 2 : 3}, 1fr);
            gap: 4mm;
            padding: 10mm;
          }
          .nametag-item {
            break-inside: avoid;
            border: 0.5px dashed #ccc;
          }
        }
        .nametag-item { border: 1px dashed #e2e8f0; }
      `}</style>

      {/* 컨트롤 바 */}
      <div className="no-print bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href={`/admin/events/${event.id}?tab=nametag`} className="text-slate-400 hover:text-slate-600 text-sm">← 디자이너로</a>
          <h1 className="font-bold text-lg">{event.name} — 네임택 출력</h1>
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

      {/* 네임택 그리드 */}
      <div className={`nametag-grid grid ${GRID_COLS[template.per_page] ?? 'grid-cols-2'} gap-4 p-8 bg-slate-100 min-h-screen`}>
        {filtered.map((r) => (
          <div key={r.id} className="nametag-item rounded overflow-hidden">
            <NametagPreview
              template={template}
              registration={r}
              eventName={event.name}
              qrUrl={`${baseUrl}/attend/${r.id}`}
              forPrint
            />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-slate-400 py-20 no-print">
            해당하는 참가자가 없습니다.
          </div>
        )}
      </div>
    </>
  )
}
