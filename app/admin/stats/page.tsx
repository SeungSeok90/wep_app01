import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PeriodFilter from './PeriodFilter'

export const revalidate = 300 // 5분 캐시 — 통계는 실시간 불필요

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

const DEVICE_COLOR: Record<string, string> = {
  desktop: 'bg-blue-400', mobile: 'bg-violet-400', tablet: 'bg-emerald-400',
}
const BROWSER_COLOR: Record<string, string> = {
  Chrome: 'bg-blue-400', Safari: 'bg-slate-400', Firefox: 'bg-orange-400',
  Edge: 'bg-cyan-400', Samsung: 'bg-indigo-400', Opera: 'bg-red-400',
}

// ── 기간 범위 계산 ────────────────────────────────────────────────────────
function getPeriodStart(period: string): string | null {
  const now = Date.now()
  switch (period) {
    case 'today': {
      const d = new Date(); d.setHours(0, 0, 0, 0)
      return d.toISOString()
    }
    case '7':  return new Date(now - 7  * 86_400_000).toISOString()
    case '30': return new Date(now - 30 * 86_400_000).toISOString()
    case 'all': return null
    default:   return new Date(now - 30 * 86_400_000).toISOString()
  }
}

// ── 차트 데이터 생성 ──────────────────────────────────────────────────────
type ChartPoint = { label: string; views: number; regs: number }

function getChartData(
  views: { visited_at: string }[],
  regs:  { registered_at: string }[],
  period: string,
): ChartPoint[] {
  if (period === 'today') {
    const hours: Record<string, ChartPoint> = {}
    for (let h = 0; h < 24; h++) {
      const k = String(h).padStart(2, '0')
      hours[k] = { label: `${h}시`, views: 0, regs: 0 }
    }
    views.forEach(v => {
      const k = String(new Date(v.visited_at).getHours()).padStart(2, '0')
      if (hours[k]) hours[k].views++
    })
    regs.forEach(r => {
      const k = String(new Date(r.registered_at).getHours()).padStart(2, '0')
      if (hours[k]) hours[k].regs++
    })
    return Object.values(hours)
  }

  if (period === 'all') {
    const months: Record<string, ChartPoint> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
      const k = d.toISOString().slice(0, 7)
      months[k] = { label: k.slice(5) + '월', views: 0, regs: 0 }
    }
    views.forEach(v => { const k = v.visited_at.slice(0, 7); if (months[k]) months[k].views++ })
    regs.forEach(r  => { const k = r.registered_at.slice(0, 7); if (months[k]) months[k].regs++ })
    return Object.values(months)
  }

  // 7일 / 30일 — 일별
  const days = period === '7' ? 7 : 30
  const dayMap: Record<string, ChartPoint> = {}
  for (let i = days - 1; i >= 0; i--) {
    const k = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
    dayMap[k] = { label: k.slice(5), views: 0, regs: 0 }
  }
  views.forEach(v => { const k = v.visited_at.slice(0, 10); if (dayMap[k]) dayMap[k].views++ })
  regs.forEach(r  => { const k = r.registered_at.slice(0, 10); if (dayMap[k]) dayMap[k].regs++ })
  return Object.values(dayMap)
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

// ── UI 컴포넌트 ────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

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

function TrendChart({ data, period }: { data: ChartPoint[]; period: string }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.views, d.regs)), 1)
  const total = data.length

  function showLabel(i: number) {
    if (total <= 12) return true
    if (total === 24) return i % 4 === 0
    if (total === 7)  return true
    // 30일
    return i === 0 || i === 9 || i === 19 || i === 29
  }

  const chartTitle = {
    today: '시간별 방문 / 등록 (오늘)',
    '7':   '일별 방문 / 등록 (최근 7일)',
    '30':  '일별 방문 / 등록 (최근 30일)',
    all:   '월별 방문 / 등록 (최근 12개월)',
  }[period] ?? '방문 / 등록 추이'

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">{chartTitle}</h3>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-300 inline-block" /> 방문</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> 등록</span>
        </div>
      </div>
      <div className="flex items-end gap-0.5 h-36">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end group relative">
            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
              <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                <div>{d.label}</div>
                <div>방문 {d.views} · 등록 {d.regs}</div>
              </div>
            </div>
            <div className="w-full bg-indigo-500 rounded-sm min-h-[1px]" style={{ height: `${(d.regs / maxVal) * 100}%` }} />
            <div className="w-full bg-blue-300 rounded-sm min-h-[1px]" style={{ height: `${(d.views / maxVal) * 100}%` }} />
            {showLabel(i) && (
              <span className="text-[9px] text-slate-400 mt-1 whitespace-nowrap">{d.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────
export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/admin/login')

  const { period = '30' } = await searchParams
  const periodStart = getPeriodStart(period)

  // 전체 기간일 때 차트/분포용 데이터는 최근 12개월로 제한
  const fetchStart = periodStart ?? new Date(Date.now() - 365 * 86_400_000).toISOString()

  // 요약 카드용 카운트 쿼리 (기간 내)
  const buildCountQuery = (table: string, dateCol: string) => {
    let q = supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
    if (periodStart) q = (q as ReturnType<typeof q.gte>).gte(dateCol, periodStart)
    return q
  }

  const [
    { count: periodViews },
    { count: periodRegs },
    { count: totalEvents },
    { data: detailViews },
    { data: detailRegs },
    { data: events },
    { data: allViewsEv },
    { data: allRegsEv },
  ] = await Promise.all([
    buildCountQuery('event_views', 'visited_at'),
    buildCountQuery('registrations', 'registered_at'),
    supabaseAdmin.from('events').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('event_views')
      .select('visited_at, device_type, browser, os, country, referrer')
      .gte('visited_at', fetchStart)
      .order('visited_at'),
    supabaseAdmin.from('registrations')
      .select('registered_at, event_id')
      .gte('registered_at', fetchStart),
    supabaseAdmin.from('events').select('id, name, slug').order('created_at', { ascending: false }),
    supabaseAdmin.from('event_views').select('event_id'),
    supabaseAdmin.from('registrations').select('event_id'),
  ])

  const views = detailViews ?? []
  const regs  = detailRegs  ?? []

  const convRate = (periodViews ?? 0) > 0
    ? ((periodRegs ?? 0) / (periodViews ?? 1) * 100).toFixed(1)
    : '0.0'

  const chartData   = getChartData(views, regs, period)
  const deviceDist  = groupCount(views, 'device_type')
  const browserDist = groupCount(views, 'browser')
  const osDist      = groupCount(views, 'os')
  const countryDist = groupCount(
    views.map(v => ({ ...v, country: countryName(v.country) })),
    'country',
  )
  const referrerDist = groupCount(
    views.filter(v => v.referrer).map(v => ({ referrer: v.referrer! })),
    'referrer',
  ).slice(0, 6)

  const totalDev  = deviceDist.reduce((s, [, c]) => s + c, 0)  || 1
  const totalBrow = browserDist.reduce((s, [, c]) => s + c, 0) || 1
  const totalOs   = osDist.reduce((s, [, c]) => s + c, 0)      || 1
  const totalCtr  = countryDist.reduce((s, [, c]) => s + c, 0) || 1
  const totalRef  = referrerDist.reduce((s, [, c]) => s + c, 0)|| 1

  // 행사별 통계 (전체 누적)
  const viewsByEvent: Record<string, number> = {}
  const regsByEvent:  Record<string, number> = {}
  for (const v of (allViewsEv ?? [])) viewsByEvent[v.event_id] = (viewsByEvent[v.event_id] ?? 0) + 1
  for (const r of (allRegsEv  ?? [])) regsByEvent[r.event_id]  = (regsByEvent[r.event_id]  ?? 0) + 1

  const eventStats = (events ?? []).map(e => ({
    id: e.id, name: e.name,
    views: viewsByEvent[e.id] ?? 0,
    regs:  regsByEvent[e.id]  ?? 0,
    conv:  (viewsByEvent[e.id] ?? 0) > 0
      ? ((regsByEvent[e.id] ?? 0) / (viewsByEvent[e.id] ?? 1) * 100).toFixed(1)
      : '-',
  })).sort((a, b) => b.views - a.views)

  const periodLabel = { today: '오늘', '7': '최근 7일', '30': '최근 30일', all: '전체 누적' }[period] ?? '최근 30일'
  const distNote = period === 'all' ? ' (최근 12개월)' : ''

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">통계 대시보드</h1>
        <PeriodFilter current={period} />
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="방문" value={(periodViews ?? 0).toLocaleString()} sub={periodLabel} />
        <SummaryCard label="등록" value={(periodRegs ?? 0).toLocaleString()} sub={periodLabel} />
        <SummaryCard label="전환율" value={`${convRate}%`} sub="방문 대비 등록 비율" />
        <SummaryCard label="전체 행사" value={(totalEvents ?? 0).toLocaleString()} sub="누적" />
      </div>

      {/* 추이 차트 */}
      <TrendChart data={chartData} period={period} />

      {/* 분포 3열 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">디바이스<span className="text-slate-400 font-normal text-xs ml-1">{periodLabel}{distNote}</span></h3>
          <div className="space-y-3">
            {deviceDist.length === 0 && <p className="text-xs text-slate-400">데이터 없음</p>}
            {deviceDist.map(([l, c]) => <DistBar key={l} label={l} count={c} total={totalDev}  color={DEVICE_COLOR[l]  ?? 'bg-slate-400'} />)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">브라우저<span className="text-slate-400 font-normal text-xs ml-1">{periodLabel}{distNote}</span></h3>
          <div className="space-y-3">
            {browserDist.length === 0 && <p className="text-xs text-slate-400">데이터 없음</p>}
            {browserDist.slice(0, 6).map(([l, c]) => <DistBar key={l} label={l} count={c} total={totalBrow} color={BROWSER_COLOR[l] ?? 'bg-slate-400'} />)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">운영체제<span className="text-slate-400 font-normal text-xs ml-1">{periodLabel}{distNote}</span></h3>
          <div className="space-y-3">
            {osDist.length === 0 && <p className="text-xs text-slate-400">데이터 없음</p>}
            {osDist.slice(0, 6).map(([l, c]) => <DistBar key={l} label={l} count={c} total={totalOs} color="bg-emerald-400" />)}
          </div>
        </div>
      </div>

      {/* 국가 + 유입경로 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">국가<span className="text-slate-400 font-normal text-xs ml-1">{periodLabel}{distNote}</span></h3>
          <div className="space-y-3">
            {countryDist.length === 0 && <p className="text-xs text-slate-400">데이터 없음</p>}
            {countryDist.slice(0, 8).map(([l, c]) => <DistBar key={l} label={l} count={c} total={totalCtr} color="bg-amber-400" />)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">유입 경로<span className="text-slate-400 font-normal text-xs ml-1">{periodLabel}{distNote}</span></h3>
          <div className="space-y-3">
            {referrerDist.length === 0 && <p className="text-xs text-slate-400">데이터 없음 (직접 접속 또는 추적 불가)</p>}
            {referrerDist.map(([l, c]) => <DistBar key={l} label={l} count={c} total={totalRef} color="bg-rose-400" />)}
          </div>
        </div>
      </div>

      {/* 행사별 통계 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">행사별 방문 / 등록 현황 <span className="text-slate-400 font-normal text-xs">(전체 누적)</span></h3>
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
