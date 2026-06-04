import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import type { Event } from '@/lib/types'
import DeleteEventButton from './DeleteEventButton'
import SearchInput from './SearchInput'

function getEventStatus(event: Event): { label: string; color: string } {
  const now = new Date()
  if (!event.event_date) return { label: '날짜 미정', color: 'bg-slate-100 text-slate-500' }
  const eventDate = new Date(event.event_date)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  if (eventDate >= todayStart && eventDate < todayEnd) return { label: 'D-Day', color: 'bg-red-100 text-red-600' }
  if (eventDate > now) {
    const diff = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { label: `D-${diff}`, color: 'bg-blue-100 text-blue-600' }
  }
  return { label: '종료', color: 'bg-slate-100 text-slate-400' }
}

function getRegisterStatus(event: Event): { label: string; color: string } {
  const now = new Date()
  if (event.register_start && new Date(event.register_start) > now) return { label: '등록 전', color: 'bg-amber-100 text-amber-600' }
  if (event.register_end && new Date(event.register_end) < now) return { label: '마감', color: 'bg-slate-100 text-slate-400' }
  return { label: '등록중', color: 'bg-emerald-100 text-emerald-600' }
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  offline: { label: '오프라인', color: 'bg-indigo-100 text-indigo-600' },
  online:  { label: '온라인',   color: 'bg-violet-100 text-violet-600' },
  hybrid:  { label: '하이브리드', color: 'bg-fuchsia-100 text-fuchsia-600' },
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  let eventsQuery = supabase.from('events').select('*').order('event_date', { ascending: false })
  if (query) eventsQuery = eventsQuery.or(`name.ilike.%${query}%,location.ilike.%${query}%,organizer.ilike.%${query}%`)

  const [{ data: events }, { data: allRegs }] = await Promise.all([
    eventsQuery,
    supabase.from('registrations').select('event_id, checked_in_at, attendance_type, custom_answers'),
  ])

  const eventList: Event[] = events ?? []
  const regs = allRegs ?? []

  const totalCheckedIn = regs.filter((r) => r.checked_in_at).length
  const totalWalkIn = regs.filter((r) => (r.custom_answers as Record<string, string>)?._walk_in === 'true').length
  const overallRate = regs.length > 0 ? Math.round((totalCheckedIn / regs.length) * 100) : 0

  const statsMap = new Map<string, { total: number; checkedIn: number; walkIn: number; offline: number; online: number }>()
  for (const r of regs) {
    const s = statsMap.get(r.event_id) ?? { total: 0, checkedIn: 0, walkIn: 0, offline: 0, online: 0 }
    s.total++
    if (r.checked_in_at) s.checkedIn++
    if ((r.custom_answers as Record<string, string>)?._walk_in === 'true') s.walkIn++
    if (r.attendance_type === 'online') s.online++; else s.offline++
    statsMap.set(r.event_id, s)
  }

  const globalStats = [
    { label: '전체 행사', value: eventList.length, sub: '개', color: 'text-slate-800' },
    { label: '전체 등록', value: regs.length, sub: '명', color: 'text-indigo-600' },
    { label: '전체 출석', value: totalCheckedIn, sub: '명', color: 'text-emerald-600' },
    { label: '현장 등록', value: totalWalkIn, sub: '명', color: 'text-amber-600' },
    { label: '출석률', value: `${overallRate}%`, sub: `${totalCheckedIn}/${regs.length}`, color: overallRate >= 80 ? 'text-emerald-600' : overallRate >= 50 ? 'text-amber-600' : 'text-red-500' },
  ]

  return (
    <main className="p-4 lg:p-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Overview</h1>
          <p className="text-slate-500 text-sm mt-1">전체 행사 현황</p>
        </div>
        <Link href="/admin/events/new" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-2 lg:px-4 rounded-lg transition-colors whitespace-nowrap">
          + 새 행사
        </Link>
      </div>

      {/* 통계 카드 (2열 → 5열) */}
      {!query && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {globalStats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* 검색 */}
      <div className="mb-4">
        <SearchInput defaultValue={query} />
      </div>

      {/* 모바일: 카드 뷰 */}
      <div className="flex flex-col gap-3 lg:hidden">
        {eventList.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400">
            {query ? (
              <>
                <p className="mb-2">"{query}" 결과 없음</p>
                <a href="/admin" className="text-sm text-indigo-500 hover:underline">초기화</a>
              </>
            ) : (
              <p>등록된 행사가 없습니다</p>
            )}
          </div>
        ) : (
          eventList.map((event: Event) => {
            const s = statsMap.get(event.id) ?? { total: 0, checkedIn: 0, walkIn: 0, offline: 0, online: 0 }
            const rate = s.total > 0 ? Math.round((s.checkedIn / s.total) * 100) : 0
            const eventStatus = getEventStatus(event)
            const regStatus = getRegisterStatus(event)
            const typeInfo = TYPE_LABELS[event.type] ?? TYPE_LABELS.offline

            return (
              <div key={event.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/events/${event.id}`} className="font-semibold hover:text-indigo-600 transition-colors block truncate">
                      {event.name}
                    </Link>
                    {event.location && <p className="text-xs text-slate-400 mt-0.5">{event.location}</p>}
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${eventStatus.color}`}>{eventStatus.label}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">등록</p>
                    <p className="font-bold text-sm">{s.total}명</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">출석</p>
                    <p className="font-bold text-sm text-emerald-600">{s.checkedIn}명</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">현장</p>
                    <p className="font-bold text-sm text-amber-600">{s.walkIn}명</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-400' : 'bg-slate-300'}`} style={{ width: `${rate}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{rate}%</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${regStatus.color}`}>{regStatus.label}</span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Link href={`/admin/checkin/${event.id}`} className="flex-1 text-center text-xs text-emerald-600 font-medium py-1.5 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                    출석체크
                  </Link>
                  <Link href={`/admin/events/${event.id}`} className="flex-1 text-center text-xs text-indigo-600 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                    편집
                  </Link>
                  <a href={`/${event.slug}`} target="_blank" className="flex-1 text-center text-xs text-slate-500 py-1.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    등록폼
                  </a>
                  <DeleteEventButton id={event.id} />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 데스크탑: 테이블 뷰 */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {eventList.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            {query ? (
              <>
                <p className="text-lg mb-2">"{query}"에 대한 결과가 없습니다.</p>
                <a href="/admin" className="text-sm text-indigo-500 hover:underline">검색 초기화</a>
              </>
            ) : (
              <p className="text-lg">등록된 행사가 없습니다.</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-slate-100">
                <th className="px-5 py-3 text-left font-medium">행사명</th>
                <th className="px-5 py-3 text-left font-medium">유형</th>
                <th className="px-5 py-3 text-left font-medium">행사일</th>
                <th className="px-5 py-3 text-left font-medium">D-Day</th>
                <th className="px-5 py-3 text-left font-medium">등록</th>
                <th className="px-5 py-3 text-left font-medium">출석</th>
                <th className="px-5 py-3 text-left font-medium">현장등록</th>
                <th className="px-5 py-3 text-left font-medium w-32">출석률</th>
                <th className="px-5 py-3 text-left font-medium">상태</th>
                <th className="px-5 py-3 text-left font-medium">액션</th>
              </tr>
            </thead>
            <tbody>
              {eventList.map((event: Event) => {
                const s = statsMap.get(event.id) ?? { total: 0, checkedIn: 0, walkIn: 0, offline: 0, online: 0 }
                const rate = s.total > 0 ? Math.round((s.checkedIn / s.total) * 100) : 0
                const eventStatus = getEventStatus(event)
                const regStatus = getRegisterStatus(event)
                const typeInfo = TYPE_LABELS[event.type] ?? TYPE_LABELS.offline

                return (
                  <tr key={event.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/admin/events/${event.id}`} className="font-medium hover:text-indigo-600 hover:underline transition-colors">{event.name}</Link>
                      {event.location && <p className="text-xs text-slate-400 mt-0.5">{event.location}</p>}
                    </td>
                    <td className="px-5 py-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>{typeInfo.label}</span></td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{event.event_date ? new Date(event.event_date).toLocaleDateString('ko-KR') : '-'}</td>
                    <td className="px-5 py-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${eventStatus.color}`}>{eventStatus.label}</span></td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{s.total}명</p>
                      {event.type === 'hybrid' && s.total > 0 && <p className="text-xs text-slate-400">현장 {s.offline} / 온 {s.online}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-emerald-600">{s.checkedIn}명</p>
                      <p className="text-xs text-slate-400">미출석 {s.total - s.checkedIn}</p>
                    </td>
                    <td className="px-5 py-4"><p className={`font-semibold ${s.walkIn > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{s.walkIn}명</p></td>
                    <td className="px-5 py-4 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-400' : 'bg-slate-300'}`} style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs font-medium w-8 text-right">{rate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${regStatus.color}`}>{regStatus.label}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 items-center">
                        <Link href={`/admin/checkin/${event.id}`} className="text-emerald-600 hover:text-emerald-800 text-xs font-medium transition-colors">출석</Link>
                        <Link href={`/admin/events/${event.id}`} className="text-indigo-500 hover:text-indigo-700 text-xs transition-colors">편집</Link>
                        <a href={`/${event.slug}`} target="_blank" className="text-slate-400 hover:text-slate-600 text-xs transition-colors">폼</a>
                        <DeleteEventButton id={event.id} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}
