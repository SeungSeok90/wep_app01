import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

// ── 상수 ──────────────────────────────────────────────────────────────────
const COUNTRY_MAP: Record<string, string> = {
  KR: '한국', US: '미국', JP: '일본', CN: '중국', GB: '영국',
  DE: '독일', FR: '프랑스', AU: '호주', CA: '캐나다', SG: '싱가포르',
  TW: '대만', HK: '홍콩', TH: '태국', VN: '베트남', IN: '인도',
  NL: '네덜란드', IT: '이탈리아', ES: '스페인', BR: '브라질', MX: '멕시코',
}
function countryName(code: string | null) {
  if (!code) return '알 수 없음'
  return COUNTRY_MAP[code] ?? code
}

// ── 집계 헬퍼 ─────────────────────────────────────────────────────────────
function groupCount<T extends Record<string, unknown>>(arr: T[], key: keyof T) {
  const map: Record<string, number> = {}
  for (const item of arr) {
    const k = String(item[key] ?? '알 수 없음')
    map[k] = (map[k] ?? 0) + 1
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

function getDailyData(
  views: { visited_at: string }[],
  regs: { registered_at: string }[],
) {
  const days: Record<string, { views: number; regs: number }> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000)
    days[d.toISOString().slice(0, 10)] = { views: 0, regs: 0 }
  }
  for (const v of views) {
    const k = v.visited_at.slice(0, 10)
    if (days[k]) days[k].views++
  }
  for (const r of regs) {
    const k = r.registered_at.slice(0, 10)
    if (days[k]) days[k].regs++
  }
  return Object.entries(days).map(([date, d]) => ({ date, ...d }))
}

// ── 컴포넌트: 요약 카드 ───────────────────────────────────────────────────
function SummaryCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── 컴포넌트: 가로 막대 분포 ──────────────────────────────────────────────
function DistBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 shrink-0 truncate text-slate-600">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-slate-500 shrink-0">{pct}%</span>
      <span className="w-10 text-right text-slate-400 shrink-0 text-xs">{count.toLocaleString()}</span>
    </div>
  )
}

// ── 컴포넌트: 일별 차트 ───────────────────────────────────────────────────
function DailyChart({ data }: { data: { date: string; views: number; regs: number }[] }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.views, d.regs)), 1)
  const showLabel = (i: number) => i === 0 || i === 14 || i === 29 || i === data.length - 1

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">일별 방문 / 등록 추이 (최근 30일)</h3>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" /> 방문</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> 등록</span>
        </div>
      </div>
      <div className="flex items-end gap-0.5 h-32">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end group relative">
            {/* 툴팁 */}
            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
              <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                <div>{d.date.slice(5)}</div>
                <div>방문 {d.views} · 등록 {d.regs}</div>
              </div>
            </div>
            <div
              className="w-full bg-indigo-500 rounded-sm min-h-[1px]"
              style={{ height: `${(d.regs / maxVal) * 100}%` }}
            />
            <div
              className="w-full bg-blue-300 rounded-sm min-h-[1px]"
              style={{ height: `${(d.views / maxVal) * 100}%` }}
            />
            {showLabel(i) && (
              <span className="text-[9px] text-slate-400 mt-1 whitespace-nowrap">{d.date.slice(5)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────
export default async function StatsPage() {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/admin/login')

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const startOfMonth = new Date()
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)

  // 병렬 데이터 조회
  const [
    { count: totalViews },
    { count: totalRegs },
    { count: thisMonthRegs },
    { count: totalEvents },
    { data: recentViews },
    { data: recentRegs },
    { data: events },
    { data: allViewsEventId },
    { data: allRegsEventId },
  ] = await Promise.all([
    supabaseAdmin.from('event_views').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('registrations').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('registrations').select('*', { count: 'exact', head: true }).gte('registered_at', startOfMonth.toISOString()),
    supabaseAdmin.from('events').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('event_views').select('visited_at, device_type, browser, os, country, city, referrer').gte('visited_at', thirtyDaysAgo).order('visited_at'),
    supabaseAdmin.from('registrations').select('registered_at, event_id').gte('registered_at', thirtyDaysAgo),
    supabaseAdmin.from('events').select('id, name, slug').order('created_at', { ascending: false }),
    supabaseAdmin.from('event_views').select('event_id'),
    supabaseAdmin.from('registrations').select('event_id'),
  ])

  const views = recentViews ?? []
  const regs = recentRegs ?? []

  // 전환율
  const convRate = (totalViews ?? 0) > 0
    ? ((totalRegs ?? 0) / (totalViews ?? 1) * 100).toFixed(1)
    : '0.0'

  // 일별 차트 데이터
  const dailyData = getDailyData(views, regs)

  // 분포 집계 (최근 30일)
  const deviceDist  = groupCount(views, 'device_type')
  const browserDist = groupCount(views, 'browser')
  const osDist      = groupCount(views, 'os')
  const countryDist = groupCount(views.map(v => ({ ...v, country: countryName(v.country) })), 'country')
  const referrerDist = groupCount(
    views.filter(v => v.referrer).map(v => ({ referrer: v.referrer! })),
    'referrer',
  ).slice(0, 5)

  const totalViewsDist  = deviceDist.reduce((s, [, c]) => s + c, 0) || 1
  const totalBrowser    = browserDist.reduce((s, [, c]) => s + c, 0) || 1
  const totalOs         = osDist.reduce((s, [, c]) => s + c, 0) || 1
  const totalCountry    = countryDist.reduce((s, [, c]) => s + c, 0) || 1
  const totalReferrer   = referrerDist.reduce((s, [, c]) => s + c, 0) || 1

  // 행사별 통계
  const viewsByEvent: Record<string, number> = {}
  const regsByEvent: Record<string, number> = {}
  for (const v of (allViewsEventId ?? [])) viewsByEvent[v.event_id] = (viewsByEvent[v.event_id] ?? 0) + 1
  for (const r of (allRegsEventId ?? [])) regsByEvent[r.event_id] = (regsByEvent[r.event_id] ?? 0) + 1

  const eventStats = (events ?? []).map(e => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    views: viewsByEvent[e.id] ?? 0,
    regs: regsByEvent[e.id] ?? 0,
    conv: (viewsByEvent[e.id] ?? 0) > 0
      ? ((regsByEvent[e.id] ?? 0) / (viewsByEvent[e.id] ?? 1) * 100).toFixed(1)
      : '-',
  })).sort((a, b) => b.views - a.views)

  const DEVICE_COLOR: Record<string, string> = {
    desktop: 'bg-blue-400', mobile: 'bg-violet-400', tablet: 'bg-emerald-400',
  }
  const BROWSER_COLOR: Record<string, string> = {
    Chrome: 'bg-blue-400', Safari: 'bg-slate-400', Firefox: 'bg-orange-400',
    Edge: 'bg-cyan-400', Samsung: 'bg-indigo-400', Opera: 'bg-red-400',
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-slate-900">통계 대시보드</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="전체 방문" value={(totalViews ?? 0).toLocaleString()} sub="누적 페이지 방문 수" />
        <SummaryCard label="전체 등록" value={(totalRegs ?? 0).toLocaleString()} sub="누적 행사 등록자 수" />
        <SummaryCard label="평균 전환율" value={`${convRate}%`} sub="방문 대비 등록 비율" />
        <SummaryCard label="이번달 등록" value={(thisMonthRegs ?? 0).toLocaleString()} sub={`전체 행사 ${totalEvents ?? 0}개`} />
      </div>

      {/* 일별 차트 */}
      <DailyChart data={dailyData} />

      {/* 분포 3열 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 디바이스 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">디바이스 유형 <span className="text-slate-400 font-normal">(최근 30일)</span></h3>
          <div className="space-y-3">
            {deviceDist.length === 0 && <p className="text-xs text-slate-400">데이터 없음</p>}
            {deviceDist.map(([label, count]) => (
              <DistBar key={label} label={label} count={count} total={totalViewsDist} color={DEVICE_COLOR[label] ?? 'bg-slate-400'} />
            ))}
          </div>
        </div>

        {/* 브라우저 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">브라우저 <span className="text-slate-400 font-normal">(최근 30일)</span></h3>
          <div className="space-y-3">
            {browserDist.length === 0 && <p className="text-xs text-slate-400">데이터 없음</p>}
            {browserDist.slice(0, 6).map(([label, count]) => (
              <DistBar key={label} label={label} count={count} total={totalBrowser} color={BROWSER_COLOR[label] ?? 'bg-slate-400'} />
            ))}
          </div>
        </div>

        {/* OS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">운영체제 <span className="text-slate-400 font-normal">(최근 30일)</span></h3>
          <div className="space-y-3">
            {osDist.length === 0 && <p className="text-xs text-slate-400">데이터 없음</p>}
            {osDist.slice(0, 6).map(([label, count]) => (
              <DistBar key={label} label={label} count={count} total={totalOs} color="bg-emerald-400" />
            ))}
          </div>
        </div>
      </div>

      {/* 국가 + 유입경로 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">국가 / 지역 <span className="text-slate-400 font-normal">(최근 30일)</span></h3>
          <div className="space-y-3">
            {countryDist.length === 0 && <p className="text-xs text-slate-400">데이터 없음</p>}
            {countryDist.slice(0, 8).map(([label, count]) => (
              <DistBar key={label} label={label} count={count} total={totalCountry} color="bg-amber-400" />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">유입 경로 <span className="text-slate-400 font-normal">(최근 30일)</span></h3>
          <div className="space-y-3">
            {referrerDist.length === 0 && <p className="text-xs text-slate-400">데이터 없음 (직접 접속 또는 추적 불가)</p>}
            {referrerDist.map(([label, count]) => (
              <DistBar key={label} label={label} count={count} total={totalReferrer} color="bg-rose-400" />
            ))}
          </div>
        </div>
      </div>

      {/* 행사별 통계 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">행사별 방문 / 등록 현황</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium">행사명</th>
                <th className="text-right px-4 py-3 font-medium">방문</th>
                <th className="text-right px-4 py-3 font-medium">등록</th>
                <th className="text-right px-4 py-3 font-medium">전환율</th>
              </tr>
            </thead>
            <tbody>
              {eventStats.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-xs">행사 없음</td></tr>
              )}
              {eventStats.map(e => (
                <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-slate-800 font-medium max-w-xs truncate">
                    <a href={`/admin/events/${e.id}`} className="hover:text-indigo-600 transition-colors">{e.name}</a>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{e.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{e.regs.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    {e.conv === '-'
                      ? <span className="text-slate-300">-</span>
                      : <span className={`font-medium ${parseFloat(e.conv) >= 10 ? 'text-emerald-600' : 'text-slate-600'}`}>{e.conv}%</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
