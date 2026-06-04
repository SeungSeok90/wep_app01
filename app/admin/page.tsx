import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import type { Event } from '@/lib/types'
import DeleteEventButton from './DeleteEventButton'
import SearchInput from './SearchInput'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  let dbQuery = supabase.from('events').select('*').order('created_at', { ascending: false })
  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,location.ilike.%${query}%,organizer.ilike.%${query}%`)
  }

  const { data: events } = await dbQuery

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex">
        <aside className="w-56 min-h-screen bg-slate-900 text-white flex flex-col">
          <div className="px-6 py-5 border-b border-slate-700">
            <span className="font-bold text-lg">등록 플랫폼</span>
            <span className="ml-2 text-xs bg-indigo-600 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <nav className="flex flex-col gap-1 p-4 flex-1">
            <span className="px-4 py-2.5 rounded-lg text-sm bg-indigo-600 text-white">행사 관리</span>
          </nav>
          <div className="p-4 border-t border-slate-700">
            <a href="/" className="text-slate-400 hover:text-white text-sm transition-colors">← 홈으로</a>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">행사 관리</h1>
              <p className="text-slate-500 text-sm mt-1">
                {query ? `"${query}" 검색 결과 ${events?.length ?? 0}개` : `총 ${events?.length ?? 0}개의 행사`}
              </p>
            </div>
            <Link
              href="/admin/events/new"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              + 새 행사 만들기
            </Link>
          </div>

          <div className="mb-4">
            <SearchInput defaultValue={query} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            {!events || events.length === 0 ? (
              <div className="px-6 py-16 text-center text-slate-400">
                {query ? (
                  <>
                    <p className="text-lg mb-2">"{query}"에 대한 결과가 없습니다.</p>
                    <a href="/admin" className="text-sm text-indigo-500 hover:underline">검색 초기화</a>
                  </>
                ) : (
                  <>
                    <p className="text-lg mb-2">등록된 행사가 없습니다.</p>
                    <p className="text-sm">새 행사를 만들어 보세요.</p>
                  </>
                )}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs border-b border-slate-100">
                    <th className="px-6 py-3 text-left font-medium">행사명</th>
                    <th className="px-6 py-3 text-left font-medium">장소</th>
                    <th className="px-6 py-3 text-left font-medium">행사일시</th>
                    <th className="px-6 py-3 text-left font-medium">등록기간</th>
                    <th className="px-6 py-3 text-left font-medium">등록 URL</th>
                    <th className="px-6 py-3 text-left font-medium">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event: Event) => (
                    <tr key={event.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <Link href={`/admin/events/${event.id}`} className="hover:text-indigo-600 hover:underline transition-colors">
                          {event.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{event.location ?? '-'}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {event.event_date ? new Date(event.event_date).toLocaleString('ko-KR') : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {event.register_start ? new Date(event.register_start).toLocaleDateString('ko-KR') : '-'}
                        {' ~ '}
                        {event.register_end ? new Date(event.register_end).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`/${event.slug}`}
                          target="_blank"
                          className="text-indigo-600 hover:underline text-xs"
                        >
                          /{event.slug}
                        </a>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <Link
                          href={`/admin/events/${event.id}?tab=registrations`}
                          className="text-indigo-500 hover:text-indigo-700 text-xs transition-colors"
                        >
                          참가자
                        </Link>
                        <DeleteEventButton id={event.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
