import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { EventField, EventChannel, Registration } from '@/lib/types'
import EventInfoForm from './EventInfoForm'
import FieldsManager from './FieldsManager'
import ChannelsManager from './ChannelsManager'
import StatsTab from './StatsTab'

type Tab = 'info' | 'fields' | 'channels' | 'stats' | 'registrations'

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  const activeTab: Tab = (tab as Tab) || 'info'

  const { data: event, error } = await supabase
    .from('events')
    .select('*, event_fields(*)')
    .eq('id', id)
    .single()

  if (error || !event) notFound()

  const fields: EventField[] = (event.event_fields ?? []).sort(
    (a: EventField, b: EventField) => a.sort_order - b.sort_order
  )

  let registrations: Registration[] = []
  if (activeTab === 'registrations') {
    const { data } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', id)
      .order('registered_at', { ascending: false })
    registrations = data ?? []
  }

  let channels: EventChannel[] = []
  if (activeTab === 'channels') {
    const { data } = await supabase
      .from('event_channels')
      .select('*')
      .eq('event_id', id)
      .order('sort_order', { ascending: true })
    channels = data ?? []
  }

  const tabLink = (t: Tab) => `/admin/events/${id}?tab=${t}`

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex">
        <aside className="w-56 min-h-screen bg-slate-900 text-white flex flex-col">
          <div className="px-6 py-5 border-b border-slate-700">
            <span className="font-bold text-lg">등록 플랫폼</span>
            <span className="ml-2 text-xs bg-indigo-600 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <nav className="flex flex-col gap-1 p-4 flex-1">
            <a href="/admin" className="px-4 py-2.5 rounded-lg text-sm bg-indigo-600 text-white">
              행사 관리
            </a>
          </nav>
          <div className="p-4 border-t border-slate-700">
            <a href="/" className="text-slate-400 hover:text-white text-sm transition-colors">← 홈으로</a>
          </div>
        </aside>

        <main className="flex-1 p-8">
          {/* 헤더 */}
          <div className="mb-6">
            <a href="/admin" className="text-slate-400 hover:text-slate-600 text-sm">← 행사 목록</a>
            <div className="flex items-start justify-between mt-2">
              <div>
                <h1 className="text-2xl font-bold">{event.name}</h1>
                <div className="flex gap-4 mt-1 text-sm text-slate-500">
                  {event.location && <span>📍 {event.location}</span>}
                  {event.event_date && (
                    <span>📅 {new Date(event.event_date).toLocaleString('ko-KR')}</span>
                  )}
                  {event.organizer && <span>👤 {event.organizer}</span>}
                </div>
              </div>
              <a
                href={`/${event.slug}`}
                target="_blank"
                className="text-sm border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
              >
                등록 페이지 열기 →
              </a>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-1 border-b border-slate-200 mb-6">
            {([
              { key: 'info', label: '기본 정보' },
              { key: 'fields', label: '추가 필드' },
              { key: 'channels', label: '채널 관리' },
              { key: 'stats', label: '시청 통계' },
              { key: 'registrations', label: '참가자 목록' },
            ] as { key: Tab; label: string }[]).map(({ key, label }) => (
              <Link
                key={key}
                href={tabLink(key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          {activeTab === 'info' && <EventInfoForm event={event} />}
          {activeTab === 'fields' && <FieldsManager event={event} fields={fields} />}
          {activeTab === 'channels' && <ChannelsManager event={event} channels={channels} />}
          {activeTab === 'stats' && <StatsTab eventId={id} />}
          {activeTab === 'registrations' && (
            <RegistrationsTab id={id} fields={fields} registrations={registrations} event={event} />
          )}
        </main>
      </div>
    </div>
  )
}

function RegistrationsTab({
  id,
  fields,
  registrations,
  event,
}: {
  id: string
  fields: EventField[]
  registrations: Registration[]
  event: { name: string; type: string; offline_capacity?: number | null; online_capacity?: number | null }
}) {
  const offlineCount = registrations.filter((r) => r.attendance_type === 'offline').length
  const onlineCount = registrations.filter((r) => r.attendance_type === 'online').length
  const isHybrid = event.type === 'hybrid'

  return (
    <div>
      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 mb-1">전체 등록</p>
          <p className="text-2xl font-bold">{registrations.length}명</p>
        </div>
        {(isHybrid || event.type === 'offline') && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 mb-1">현장 참석</p>
            <p className="text-2xl font-bold">{offlineCount}명</p>
            {event.offline_capacity && (
              <p className="text-xs text-slate-400 mt-1">정원 {event.offline_capacity}명</p>
            )}
          </div>
        )}
        {(isHybrid || event.type === 'online') && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 mb-1">온라인 참석</p>
            <p className="text-2xl font-bold">{onlineCount}명</p>
            {event.online_capacity && (
              <p className="text-xs text-slate-400 mt-1">정원 {event.online_capacity}명</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end mb-4">
        <a
          href={`/api/events/${id}/registrations/export`}
          className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          엑셀 내보내기
        </a>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {registrations.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            <p className="text-lg mb-2">아직 등록한 참가자가 없습니다.</p>
          </div>
        ) : (
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-slate-100">
                <th className="px-4 py-3 text-left font-medium">등록일시</th>
                {isHybrid && <th className="px-4 py-3 text-left font-medium">참석방식</th>}
                <th className="px-4 py-3 text-left font-medium">이름</th>
                <th className="px-4 py-3 text-left font-medium">이메일</th>
                <th className="px-4 py-3 text-left font-medium">연락처</th>
                <th className="px-4 py-3 text-left font-medium">회사명</th>
                <th className="px-4 py-3 text-left font-medium">부서</th>
                <th className="px-4 py-3 text-left font-medium">직급</th>
                {fields.map((f) => (
                  <th key={f.id} className="px-4 py-3 text-left font-medium">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(r.registered_at).toLocaleString('ko-KR')}
                  </td>
                  {isHybrid && (
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.attendance_type === 'online'
                          ? 'bg-violet-100 text-violet-600'
                          : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        {r.attendance_type === 'online' ? '온라인' : '현장'}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-slate-500">{r.email}</td>
                  <td className="px-4 py-3 text-slate-500">{r.phone ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{r.company ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{r.department ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{r.position ?? '-'}</td>
                  {fields.map((f) => {
                    const answer = r.custom_answers?.[f.label]
                    return (
                      <td key={f.id} className="px-4 py-3 text-slate-500">
                        {Array.isArray(answer) ? answer.join(', ') : (answer ?? '-')}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
