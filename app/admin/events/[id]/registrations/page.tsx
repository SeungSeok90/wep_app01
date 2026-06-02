import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Registration, EventField } from '@/lib/types'

export default async function RegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: event, error } = await supabase
    .from('events')
    .select('*, event_fields(*)')
    .eq('id', id)
    .single()

  if (error || !event) notFound()

  const { data: registrations } = await supabase
    .from('registrations')
    .select('*')
    .eq('event_id', id)
    .order('registered_at', { ascending: false })

  const fields: EventField[] = (event.event_fields ?? []).sort(
    (a: EventField, b: EventField) => a.sort_order - b.sort_order
  )

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

        <main className="flex-1 p-8 overflow-x-auto">
          <div className="mb-6">
            <a href="/admin" className="text-slate-400 hover:text-slate-600 text-sm">← 목록으로</a>
            <div className="flex items-center justify-between mt-2">
              <div>
                <h1 className="text-2xl font-bold">{event.name}</h1>
                <p className="text-slate-500 text-sm mt-1">총 {registrations?.length ?? 0}명 등록</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/events/${id}`}
                  className="text-sm border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
                >
                  행사 편집
                </Link>
                <a
                  href={`/api/events/${id}/registrations/export`}
                  className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  엑셀 내보내기
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            {!registrations || registrations.length === 0 ? (
              <div className="px-6 py-16 text-center text-slate-400">
                <p className="text-lg mb-2">아직 등록한 참가자가 없습니다.</p>
              </div>
            ) : (
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-slate-400 text-xs border-b border-slate-100">
                    <th className="px-4 py-3 text-left font-medium">등록일시</th>
                    <th className="px-4 py-3 text-left font-medium">이름</th>
                    <th className="px-4 py-3 text-left font-medium">이메일</th>
                    <th className="px-4 py-3 text-left font-medium">연락처</th>
                    <th className="px-4 py-3 text-left font-medium">회사명</th>
                    <th className="px-4 py-3 text-left font-medium">부서</th>
                    <th className="px-4 py-3 text-left font-medium">직급</th>
                    {fields.map((field) => (
                      <th key={field.id} className="px-4 py-3 text-left font-medium">{field.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r: Registration) => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(r.registered_at).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-slate-500">{r.email}</td>
                      <td className="px-4 py-3 text-slate-500">{r.phone ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{r.company ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{r.department ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{r.position ?? '-'}</td>
                      {fields.map((field) => {
                        const answer = r.custom_answers?.[field.label]
                        return (
                          <td key={field.id} className="px-4 py-3 text-slate-500">
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
        </main>
      </div>
    </div>
  )
}
