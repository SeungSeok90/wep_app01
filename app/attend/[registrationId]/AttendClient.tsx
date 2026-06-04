'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { Registration, NametagTemplate } from '@/lib/types'
import NametagPreview from '@/app/admin/events/[id]/NametagPreview'

interface Props {
  registration: Registration & { events: { id: string; name: string; event_date: string | null; location: string | null } }
  event: { id: string; name: string; event_date: string | null; location: string | null }
  template: NametagTemplate
}

export default function AttendClient({ registration, event, template }: Props) {
  const [checkedIn, setCheckedIn] = useState(!!registration.checked_in_at)
  const [checkedInAt, setCheckedInAt] = useState<string | null>(registration.checked_in_at)
  const [loading, setLoading] = useState(false)
  const [showPrint, setShowPrint] = useState(false)

  const qrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/attend/${registration.id}`
    : `/attend/${registration.id}`

  async function handleCheckIn() {
    setLoading(true)
    const res = await fetch(`/api/registrations/${registration.id}/checkin`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setCheckedIn(true)
      setCheckedInAt(data.checked_in_at)
    }
    setLoading(false)
  }

  function handlePrint() {
    setShowPrint(true)
    setTimeout(() => window.print(), 300)
  }

  return (
    <>
      {/* 인쇄 시 네임택만 보이도록 */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { margin: 0; }
        }
        .print-only { display: none; }
      `}</style>

      {/* 인쇄용 네임택 */}
      {showPrint && (
        <div className="print-only">
          <NametagPreview
            template={template}
            registration={registration}
            eventName={event.name}
            qrUrl={qrUrl}
            forPrint
          />
        </div>
      )}

      {/* 화면 UI */}
      <div className="no-print min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* 출석 상태 배지 */}
          <div className={`text-center mb-6 px-4 py-2 rounded-full text-sm font-medium inline-block w-full ${
            checkedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {checkedIn ? `✅ 출석 완료 · ${new Date(checkedInAt!).toLocaleTimeString('ko-KR')}` : '⏳ 미출석'}
          </div>

          {/* 참가자 카드 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
            <div className="bg-indigo-600 px-6 py-4 text-white">
              <p className="text-xs text-indigo-200 mb-1">{event.name}</p>
              {event.event_date && (
                <p className="text-xs text-indigo-200">
                  {new Date(event.event_date).toLocaleString('ko-KR')}
                </p>
              )}
            </div>

            <div className="p-6 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-2xl font-bold text-slate-900">{registration.name}</p>
                {registration.company && (
                  <p className="text-slate-600 mt-1">{registration.company}</p>
                )}
                <div className="flex gap-2 mt-1 text-sm text-slate-400">
                  {registration.department && <span>{registration.department}</span>}
                  {registration.department && registration.position && <span>·</span>}
                  {registration.position && <span>{registration.position}</span>}
                </div>
              </div>
              <QRCodeSVG value={qrUrl} size={72} />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex flex-col gap-3">
            {!checkedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3.5 rounded-xl transition-colors text-base"
              >
                {loading ? '처리 중...' : '✅ 출석 체크'}
              </button>
            ) : (
              <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium py-3.5 rounded-xl text-center text-base">
                출석 완료
              </div>
            )}

            <button
              onClick={handlePrint}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium py-3.5 rounded-xl transition-colors text-base"
            >
              🖨️ 네임택 인쇄
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            {registration.attendance_type === 'online' ? '🌐 온라인 참석' : '🏢 현장 참석'}
          </p>
        </div>
      </div>
    </>
  )
}
