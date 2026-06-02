import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import type { EventField } from '@/lib/types'
import RegistrationForm from './RegistrationForm'

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

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-indigo-600 px-8 py-6 text-white">
            <h1 className="text-xl font-bold">{event.name}</h1>
            <div className="mt-2 flex flex-col gap-1 text-indigo-100 text-sm">
              {event.location && <span>📍 {event.location}</span>}
              {event.event_date && (
                <span>📅 {new Date(event.event_date).toLocaleString('ko-KR')}</span>
              )}
              {event.organizer && <span>👤 {event.organizer}</span>}
            </div>
          </div>

          <div className="px-8 py-6">
            {isBeforeStart ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-lg font-medium mb-2">등록 기간 전입니다</p>
                <p className="text-sm">
                  등록 시작: {new Date(event.register_start).toLocaleString('ko-KR')}
                </p>
              </div>
            ) : isAfterEnd ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-lg font-medium mb-2">등록이 마감되었습니다</p>
              </div>
            ) : (
              <RegistrationForm slug={slug} fields={fields} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
