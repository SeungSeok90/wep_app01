import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import type { EventField } from '@/lib/types'
import RegistrationForm from './RegistrationForm'
import Link from 'next/link'

export default async function RegistrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: event, error } = await supabase
    .from('events')
    .select('*, event_fields(*)')
    .eq('slug', slug)
    .single()

  if (error || !event) notFound()

  const fields: EventField[] = (event.event_fields ?? []).sort(
    (a: EventField, b: EventField) => a.sort_order - b.sort_order
  )

  const now = new Date()
  const isBeforeStart = event.register_start && new Date(event.register_start) > now
  const isAfterEnd = event.register_end && new Date(event.register_end) < now
  const isOnline = event.type === 'online' || event.type === 'hybrid'

  const headerColor =
    event.type === 'online' ? 'bg-violet-600' :
    event.type === 'hybrid' ? 'bg-gradient-to-r from-indigo-600 to-violet-600' :
    'bg-indigo-600'

  const typeLabel =
    event.type === 'online' ? '🌐 온라인 웨비나' :
    event.type === 'hybrid' ? '🔀 하이브리드' :
    '🏢 오프라인'

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className={`px-8 py-6 text-white ${headerColor}`}>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{typeLabel}</span>
            <h1 className="text-xl font-bold mt-2">{event.name}</h1>
            <div className="mt-2 flex flex-col gap-1 text-white/80 text-sm">
              {event.location && <span>📍 {event.location}</span>}
              {event.event_date && <span>📅 {new Date(event.event_date).toLocaleString('ko-KR')}</span>}
              {event.organizer && <span>👤 {event.organizer}</span>}
            </div>
          </div>

          <div className="px-8 py-6">
            {/* 온라인/하이브리드 라이브 입장 버튼 */}
            {isOnline && (
              <div className="mb-6 p-4 bg-violet-50 border border-violet-100 rounded-xl">
                <p className="text-sm text-violet-700 font-medium mb-1">웨비나 라이브 시청</p>
                <p className="text-xs text-violet-500 mb-3">등록 후 아래 버튼으로 라이브에 입장하세요.</p>
                <Link
                  href={`/${slug}/live`}
                  className="block w-full text-center bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  🎥 라이브 입장하기
                </Link>
              </div>
            )}

            {isBeforeStart ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-lg font-medium mb-2">등록 기간 전입니다</p>
                <p className="text-sm">등록 시작: {new Date(event.register_start).toLocaleString('ko-KR')}</p>
              </div>
            ) : isAfterEnd ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-lg font-medium mb-2">등록이 마감되었습니다</p>
              </div>
            ) : (
              <RegistrationForm slug={slug} fields={fields} eventType={event.type} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
