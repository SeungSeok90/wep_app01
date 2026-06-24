import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Monitor, ChevronRight, CalendarDays } from 'lucide-react'

export default async function ConsolePage() {
  const { data: events } = await supabase
    .from('events')
    .select('id, name, event_date, type')
    .order('event_date', { ascending: false })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Monitor className="w-6 h-6 text-indigo-600" />
        <h1 className="text-xl font-bold text-slate-800">행사 콘솔</h1>
      </div>

      {!events?.length ? (
        <div className="text-center py-16 text-slate-400">
          <Monitor className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>등록된 행사가 없습니다.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/admin/console/${event.id}`}
                className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-indigo-400 hover:shadow-sm transition-all group"
              >
                <div>
                  <p className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {event.name}
                  </p>
                  {event.event_date && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {new Date(event.event_date).toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
