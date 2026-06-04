import { supabase } from '@/lib/supabase'
import type { EventChannel } from '@/lib/types'

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}초`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return `${m}분 ${s}초`
  const h = Math.floor(m / 60)
  return `${h}시간 ${m % 60}분`
}

export default async function StatsTab({ eventId }: { eventId: string }) {
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

  const [{ data: sessions }, { data: channels }, { data: liveSessions }] = await Promise.all([
    supabase.from('webinar_sessions').select('*').eq('event_id', eventId),
    supabase.from('event_channels').select('*').eq('event_id', eventId).order('sort_order'),
    // 2분 이내 last_seen = 현재 접속 중
    supabase
      .from('webinar_sessions')
      .select('*')
      .eq('event_id', eventId)
      .gte('last_seen', twoMinutesAgo),
  ])

  const allSessions = sessions ?? []
  const currentSessions = liveSessions ?? []
  const channelList: EventChannel[] = channels ?? []

  const completedSessions = allSessions.filter((s) => s.duration_seconds != null)
  const avgDuration = completedSessions.length > 0
    ? Math.floor(completedSessions.reduce((sum: number, s: { duration_seconds: number }) => sum + s.duration_seconds, 0) / completedSessions.length)
    : 0

  // 채널별 통계
  const channelStats = channelList.map((ch) => {
    const chSessions = allSessions.filter((s) => s.channel_id === ch.id)
    const chLive = currentSessions.filter((s) => s.channel_id === ch.id)
    const chCompleted = chSessions.filter((s) => s.duration_seconds != null)
    const chAvg = chCompleted.length > 0
      ? Math.floor(chCompleted.reduce((sum: number, s: { duration_seconds: number }) => sum + s.duration_seconds, 0) / chCompleted.length)
      : 0
    return { channel: ch, total: chSessions.length, live: chLive.length, avgDuration: chAvg }
  })

  return (
    <div>
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">현재 접속자</p>
          <p className="text-3xl font-bold text-indigo-600">{currentSessions.length}</p>
          <p className="text-xs text-slate-400 mt-1">명 시청 중</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">총 세션 수</p>
          <p className="text-3xl font-bold">{allSessions.length}</p>
          <p className="text-xs text-slate-400 mt-1">누적 입장</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">평균 시청 시간</p>
          <p className="text-3xl font-bold">{avgDuration > 0 ? formatDuration(avgDuration) : '-'}</p>
          <p className="text-xs text-slate-400 mt-1">퇴장자 기준</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs text-slate-400 mb-1">운영 채널</p>
          <p className="text-3xl font-bold">{channelList.length || 1}</p>
          <p className="text-xs text-slate-400 mt-1">{channelList.length > 0 ? '멀티 채널' : '단일 채널'}</p>
        </div>
      </div>

      {/* 채널별 통계 */}
      {channelList.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-sm">채널별 시청 현황</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-slate-100">
                <th className="px-6 py-3 text-left font-medium">채널</th>
                <th className="px-6 py-3 text-left font-medium">현재 접속</th>
                <th className="px-6 py-3 text-left font-medium">총 입장</th>
                <th className="px-6 py-3 text-left font-medium">평균 시청 시간</th>
              </tr>
            </thead>
            <tbody>
              {channelStats.map(({ channel, total, live, avgDuration: avg }) => (
                <tr key={channel.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium">{channel.name}</td>
                  <td className="px-6 py-3">
                    <span className="flex items-center gap-1.5">
                      {live > 0 && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
                      {live}명
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{total}회</td>
                  <td className="px-6 py-3 text-slate-500">{avg > 0 ? formatDuration(avg) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 최근 세션 목록 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm">세션 기록</h3>
          <span className="text-xs text-slate-400">최근 50건</span>
        </div>
        {allSessions.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">아직 접속 기록이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-slate-100">
                <th className="px-6 py-3 text-left font-medium">이름</th>
                <th className="px-6 py-3 text-left font-medium">채널</th>
                <th className="px-6 py-3 text-left font-medium">입장</th>
                <th className="px-6 py-3 text-left font-medium">시청 시간</th>
                <th className="px-6 py-3 text-left font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {allSessions.slice(0, 50).map((s: {
                id: string; user_name: string; channel_id: string | null;
                joined_at: string; duration_seconds: number | null; last_seen: string
              }) => {
                const ch = channelList.find((c) => c.id === s.channel_id)
                const isLive = new Date(s.last_seen) >= new Date(twoMinutesAgo)
                return (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium">{s.user_name}</td>
                    <td className="px-6 py-3 text-slate-500 text-xs">{ch?.name ?? '단일 채널'}</td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {new Date(s.joined_at).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {s.duration_seconds != null ? formatDuration(s.duration_seconds) : '-'}
                    </td>
                    <td className="px-6 py-3">
                      {isLive ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />시청 중
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">퇴장</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
