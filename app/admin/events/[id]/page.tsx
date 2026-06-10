import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { EventField, EventChannel, Registration, NametagTemplate } from '@/lib/types'
import { DEFAULT_NAMETAG_TEMPLATE } from '@/lib/types'
import { getAdminUser } from '@/lib/auth'
import EventInfoForm from './EventInfoForm'
import FieldsManager from './FieldsManager'
import ChannelsManager from './ChannelsManager'
import StatsTab from './StatsTab'
import NametagDesigner from './NametagDesigner'
import MetaTab from './MetaTab'
import EmailTab from './EmailTab'
import RegistrationsTab from './RegistrationsTab'

type Tab = 'info' | 'fields' | 'channels' | 'stats' | 'nametag' | 'meta' | 'email' | 'registrations'

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const [{ id }, { tab }, adminUser] = await Promise.all([params, searchParams, getAdminUser()])
  const isSuper = adminUser?.role === 'super'
  const activeTab: Tab = (tab as Tab) || (isSuper ? 'info' : 'stats')

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
    <main className="p-4 lg:p-8">
      {/* 헤더 */}
      <div className="mb-6">
        <a href="/admin" className="text-slate-400 hover:text-slate-600 text-sm">← 행사 목록</a>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mt-2 gap-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">{event.name}</h1>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-500">
              {event.location && <span>📍 {event.location}</span>}
              {event.event_date && <span>📅 {new Date(event.event_date).toLocaleString('ko-KR')}</span>}
              {event.organizer && <span>👤 {event.organizer}</span>}
            </div>
          </div>
          <a href={`/${event.slug}`} target="_blank"
            className="text-sm border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors whitespace-nowrap self-start">
            등록 페이지 →
          </a>
        </div>
      </div>

      {/* 탭 (가로 스크롤) */}
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {([
          // 설정 탭 — super만 표시
          ...(isSuper ? [
            { key: 'info', label: '기본 정보' },
            { key: 'fields', label: '추가 필드' },
            { key: 'channels', label: '채널 관리' },
            { key: 'nametag', label: '네임택' },
            { key: 'meta', label: 'SEO' },
            { key: 'email', label: '이메일' },
          ] : []),
          // 현황 탭 — 모두 표시
          { key: 'stats', label: '시청 통계' },
          { key: 'registrations', label: '참가자' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <Link key={key} href={tabLink(key)}
            className={`px-3 lg:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
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
      {activeTab === 'nametag' && (
        <NametagDesigner
          eventId={id}
          eventName={event.name}
          initialTemplate={(event.nametag_template as NametagTemplate) ?? DEFAULT_NAMETAG_TEMPLATE}
          customFields={fields}
        />
      )}
      {activeTab === 'meta' && <MetaTab event={event} />}
      {activeTab === 'email' && <EmailTab event={event} />}
      {activeTab === 'registrations' && (
        <RegistrationsTab
          eventId={id}
          fields={fields}
          initialRegistrations={registrations}
          eventType={event.type}
          offlineCapacity={event.offline_capacity}
          onlineCapacity={event.online_capacity}
        />
      )}
    </main>
  )
}

