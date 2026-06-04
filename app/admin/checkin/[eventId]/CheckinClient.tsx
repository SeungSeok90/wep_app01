'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import type { NametagTemplate, Registration } from '@/lib/types'
import NametagCard from '@/app/admin/events/[id]/NametagCard'

const CameraScanner = dynamic(() => import('./CameraScanner'), { ssr: false })

type Tab = 'usb' | 'camera' | 'walkin' | 'search'

interface Stats { total: number; checked_in: number; not_checked_in: number }

interface CheckinResult {
  status: 'success' | 'already' | 'error'
  registrationId?: string
  name?: string; company?: string; department?: string; position?: string
  attendance_type?: string; checked_in_at?: string; message?: string
}

interface LogEntry {
  id: string; name: string; company: string | null
  status: 'success' | 'already'; time: string; isWalkIn?: boolean
}

interface SearchResult {
  id: string; name: string; company: string | null
  department: string | null; position: string | null
  attendance_type: string; checked_in_at: string | null
}

interface EventField { id: string; label: string; is_required: boolean }

export default function CheckinClient({
  event,
  template,
}: {
  event: { id: string; name: string; slug: string; event_date: string | null; event_fields: EventField[] }
  template: NametagTemplate
}) {
  const [tab, setTab] = useState<Tab>('usb')
  const [stats, setStats] = useState<Stats>({ total: 0, checked_in: 0, not_checked_in: 0 })
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [walkInForm, setWalkInForm] = useState({ name: '', phone: '', company: '', department: '', position: '' })
  const [walkInLoading, setWalkInLoading] = useState(false)
  const [printRegistrationId, setPrintRegistrationId] = useState<string | null>(null)
  const usbInputRef = useRef<HTMLInputElement>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 통계 로드
  async function fetchStats() {
    const res = await fetch(`/api/events/${event.id}/checkin-stats`)
    const data = await res.json()
    setStats(data)
  }

  useEffect(() => {
    fetchStats()
  }, [event.id])

  // Supabase Realtime — 다른 기기 체크인도 실시간 반영
  useEffect(() => {
    const channel = supabase
      .channel(`checkin:${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations', filter: `event_id=eq.${event.id}` }, fetchStats)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [event.id])

  // USB 탭일 때 포커스
  useEffect(() => {
    if (tab === 'usb') usbInputRef.current?.focus()
  }, [tab])

  function scheduleReset(delay = 3000) {
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => {
      setResult(null)
      if (tab === 'usb') usbInputRef.current?.focus()
    }, delay)
  }

  function extractId(raw: string): string | null {
    const urlMatch = raw.trim().match(/\/attend\/([a-f0-9-]{36})/)
    if (urlMatch) return urlMatch[1]
    if (/^[a-f0-9-]{36}$/.test(raw.trim())) return raw.trim()
    return null
  }

  // 인쇄 함수
  function handlePrint(regId: string) {
    setPrintRegistrationId(regId)
    setTimeout(() => window.print(), 200)
  }

  async function processCheckin(registrationId: string, isWalkIn = false) {
    if (processing) return
    setProcessing(true)
    setResult(null)

    const res = await fetch(`/api/registrations/${registrationId}/checkin`, { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      setResult({ status: 'success', registrationId, name: data.name, company: data.company, department: data.department, position: data.position, attendance_type: data.attendance_type, checked_in_at: data.checked_in_at })
      setLogs((prev) => [{ id: registrationId, name: data.name, company: data.company, status: 'success', time: new Date().toLocaleTimeString('ko-KR'), isWalkIn }, ...prev.slice(0, 29)])
      fetchStats()
    } else if (res.status === 400 && data.checked_in_at) {
      const info = await fetch(`/api/registrations/${registrationId}`).then((r) => r.json()).catch(() => ({}))
      setResult({ status: 'already', registrationId, name: info.name, company: info.company, checked_in_at: data.checked_in_at, message: data.error })
      setLogs((prev) => [{ id: registrationId, name: info.name ?? '-', company: info.company, status: 'already', time: new Date().toLocaleTimeString('ko-KR') }, ...prev.slice(0, 29)])
    } else {
      setResult({ status: 'error', message: data.error ?? '처리 실패' })
    }

    setProcessing(false)
    scheduleReset()
  }

  // USB 스캔 입력
  function handleUsbKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const val = usbInputRef.current?.value ?? ''
      if (usbInputRef.current) usbInputRef.current.value = ''
      const id = extractId(val)
      if (id) processCheckin(id)
      else if (val.trim()) setResult({ status: 'error', message: '올바른 QR코드가 아닙니다.' })
    }
  }

  // 카메라 스캔 콜백
  const handleCameraScan = useCallback((text: string) => {
    const id = extractId(text)
    if (id && !processing) processCheckin(id)
  }, [processing])

  // 참가자 전체 목록 (검색탭 진입 시 로드)
  const [allRegistrations, setAllRegistrations] = useState<SearchResult[]>([])

  useEffect(() => {
    if (tab !== 'search') return
    setSearching(true)
    fetch(`/api/events/${event.id}/registrations/search?q=`)
      .then((r) => r.json())
      .then((data) => { setAllRegistrations(Array.isArray(data) ? data : []); setSearching(false) })
      .catch(() => setSearching(false))
  }, [tab, event.id])

  // 검색어 필터링 (클라이언트 사이드)
  const filteredResults = searchQuery.trim()
    ? allRegistrations.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.company ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allRegistrations

  // 출석 완료 후 목록 업데이트
  function refreshAllRegistrations() {
    fetch(`/api/events/${event.id}/registrations/search?q=`)
      .then((r) => r.json())
      .then((data) => setAllRegistrations(Array.isArray(data) ? data : []))
      .catch(() => {})
  }

  // 출석 취소
  async function processUndo(registrationId: string) {
    const res = await fetch(`/api/registrations/${registrationId}/checkin`, { method: 'DELETE' })
    if (res.ok) {
      setAllRegistrations((prev) =>
        prev.map((r) => r.id === registrationId ? { ...r, checked_in_at: null } : r)
      )
      setLogs((prev) => prev.filter((l) => l.id !== registrationId))
      fetchStats()
    }
  }

  // 현장 등록 + 즉시 체크인
  async function handleWalkIn(e: React.FormEvent) {
    e.preventDefault()
    if (!walkInForm.name.trim()) return
    setWalkInLoading(true)

    const res = await fetch(`/api/events/${event.id}/walk-in-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(walkInForm),
    })
    const data = await res.json()

    if (res.ok) {
      setResult({ status: 'success', registrationId: data.id, name: data.name, company: data.company, department: data.department, position: data.position, attendance_type: 'offline', checked_in_at: data.checked_in_at })
      setLogs((prev) => [{ id: data.id, name: data.name, company: data.company, status: 'success', time: new Date().toLocaleTimeString('ko-KR'), isWalkIn: true }, ...prev.slice(0, 29)])
      setWalkInForm({ name: '', phone: '', company: '', department: '', position: '' })
      fetchStats()
      scheduleReset(4000)
    } else {
      setResult({ status: 'error', message: data.error ?? '등록 실패' })
      scheduleReset()
    }
    setWalkInLoading(false)
  }

  const rate = stats.total > 0 ? Math.round((stats.checked_in / stats.total) * 100) : 0

  const resultBg = result?.status === 'success' ? 'bg-emerald-500' : result?.status === 'already' ? 'bg-amber-400' : 'bg-red-500'

  const TABS: { key: Tab; label: string; shortLabel: string }[] = [
    { key: 'usb',    label: '📡 USB 스캐너', shortLabel: '📡 USB' },
    { key: 'camera', label: '📷 카메라 스캔', shortLabel: '📷 카메라' },
    { key: 'walkin', label: '✍️ 현장 등록',  shortLabel: '✍️ 현장' },
    { key: 'search', label: '🔍 참가자 검색', shortLabel: '🔍 검색' },
  ]

  // 인쇄용 registration 객체 생성
  const printRegistration: Partial<Registration> | undefined = result?.registrationId ? {
    id: result.registrationId,
    name: result.name ?? '',
    company: result.company ?? null,
    department: result.department ?? null,
    position: result.position ?? null,
  } : undefined

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const qrUrl = printRegistrationId ? `${baseUrl}/attend/${printRegistrationId}` : ''

  return (
    <>
      {/* 인쇄 스타일 + 인쇄용 네임택 */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          .print-nametag { display: flex !important; align-items: center; justify-content: center; width: 100vw; height: 100vh; }
        }
        .print-nametag { display: none; }
      `}</style>

      {printRegistrationId && printRegistration && (
        <div className="print-nametag">
          <NametagCard
            template={template}
            registration={printRegistration}
            eventName={event.name}
            qrUrl={qrUrl}
            forPrint
          />
        </div>
      )}

    <div className="no-print min-h-screen bg-slate-900 text-white flex flex-col" onClick={() => tab === 'usb' && usbInputRef.current?.focus()}>

      {/* 헤더 */}
      <header className="border-b border-slate-700 px-4 lg:px-6 py-3 lg:py-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <a href="/admin" className="text-slate-400 hover:text-slate-200 text-xs mb-1 block">← 관리자</a>
            <h1 className="font-bold text-base lg:text-lg leading-tight">{event.name}</h1>
            {event.event_date && <p className="text-slate-400 text-xs">{new Date(event.event_date).toLocaleString('ko-KR')}</p>}
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />LIVE
          </span>
        </div>

        {/* 통계 바 */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '등록', value: stats.total, color: 'text-white' },
            { label: '출석', value: stats.checked_in, color: 'text-emerald-400' },
            { label: '미출석', value: stats.not_checked_in, color: 'text-amber-400' },
            { label: '출석률', value: `${rate}%`, color: rate >= 80 ? 'text-emerald-400' : rate >= 50 ? 'text-amber-400' : 'text-red-400' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-800 rounded-lg px-2 lg:px-4 py-2 lg:py-3 text-center">
              <p className="text-slate-400 text-xs mb-1">{s.label}</p>
              <p className={`text-lg lg:text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* 출석률 프로그레스 */}
        <div className="mt-2 bg-slate-700 rounded-full h-1.5">
          <div className="bg-emerald-400 h-1.5 rounded-full transition-all" style={{ width: `${rate}%` }} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 메인 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 탭 */}
          <div className="flex border-b border-slate-700 shrink-0 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-3 lg:px-5 py-3 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? 'border-b-2 border-indigo-400 text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <span className="lg:hidden">{t.shortLabel}</span>
                <span className="hidden lg:inline">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {/* 결과 표시 */}
            {result && (
              <div className={`${resultBg} rounded-2xl p-6 text-center mb-6`}>
                {result.status === 'success' && (
                  <>
                    <div className="text-5xl mb-3">✅</div>
                    <p className="text-2xl font-bold mb-1">{result.name}</p>
                    {result.company && <p className="text-white/80 mb-1">{result.company}</p>}
                    <div className="flex justify-center gap-2 text-white/70 text-sm mb-2">
                      {result.department && <span>{result.department}</span>}
                      {result.department && result.position && <span>·</span>}
                      {result.position && <span>{result.position}</span>}
                    </div>
                    <p className="text-white/60 text-xs mb-3">출석 처리 완료 · {result.checked_in_at && new Date(result.checked_in_at).toLocaleTimeString('ko-KR')}</p>
                    {result.registrationId && (
                      <button
                        onClick={() => handlePrint(result.registrationId!)}
                        className="mt-1 bg-white/20 hover:bg-white/30 text-white text-sm px-5 py-2 rounded-lg transition-colors"
                      >
                        🖨️ 네임택 인쇄
                      </button>
                    )}
                  </>
                )}
                {result.status === 'already' && (
                  <>
                    <div className="text-5xl mb-3">⚠️</div>
                    <p className="text-2xl font-bold mb-1">{result.name ?? '이미 출석'}</p>
                    {result.company && <p className="text-white/80 mb-2">{result.company}</p>}
                    <p className="text-white/70 text-sm mb-3">{result.checked_in_at && `${new Date(result.checked_in_at).toLocaleTimeString('ko-KR')}에 이미 출석 처리됨`}</p>
                    {result.registrationId && (
                      <button
                        onClick={() => handlePrint(result.registrationId!)}
                        className="mt-1 bg-white/20 hover:bg-white/30 text-white text-sm px-5 py-2 rounded-lg transition-colors"
                      >
                        🖨️ 네임택 인쇄
                      </button>
                    )}
                  </>
                )}
                {result.status === 'error' && (
                  <>
                    <div className="text-5xl mb-3">❌</div>
                    <p className="text-xl font-bold">{result.message}</p>
                  </>
                )}
              </div>
            )}

            {/* USB 탭 */}
            {tab === 'usb' && !result && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-24 h-24 border-4 border-dashed border-slate-600 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-4xl">📡</span>
                </div>
                <p className="text-slate-300 text-xl font-medium mb-2">
                  {processing ? '처리 중...' : 'QR코드를 스캔해 주세요'}
                </p>
                <p className="text-slate-500 text-sm">USB 스캐너가 자동으로 입력을 캡처합니다</p>
                <input ref={usbInputRef} onKeyDown={handleUsbKeyDown}
                  className="opacity-0 absolute w-0 h-0" autoFocus autoComplete="off" />
              </div>
            )}

            {/* 카메라 탭 */}
            {tab === 'camera' && (
              <div className="flex flex-col items-center">
                {!result && <CameraScanner onScan={handleCameraScan} />}
              </div>
            )}

            {/* 현장 등록 탭 */}
            {tab === 'walkin' && !result && (
              <form onSubmit={handleWalkIn} className="max-w-md mx-auto flex flex-col gap-4">
                <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-300 mb-2">
                  현장에서 사전 등록 없이 참석하는 분을 등록하고 즉시 출석 처리합니다.
                </div>
                {[
                  { key: 'name', label: '이름 *', required: true },
                  { key: 'phone', label: '연락처', required: false },
                  { key: 'company', label: '회사명', required: false },
                  { key: 'department', label: '부서', required: false },
                  { key: 'position', label: '직급', required: false },
                ].map(({ key, label, required }) => (
                  <div key={key}>
                    <label className="text-sm text-slate-300 mb-1 block">{label}</label>
                    <input
                      required={required}
                      value={walkInForm[key as keyof typeof walkInForm]}
                      onChange={(e) => setWalkInForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
                <button type="submit" disabled={walkInLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors">
                  {walkInLoading ? '등록 중...' : '✍️ 현장 등록 + 출석 처리'}
                </button>
              </form>
            )}

            {/* 참가자 검색 탭 */}
            {tab === 'search' && (
              <div className="max-w-lg mx-auto">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="이름, 회사명으로 검색..."
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white px-3 py-3 text-sm">✕</button>
                  )}
                </div>

                <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
                  <span>
                    {searching ? '불러오는 중...' : `${filteredResults.length}명`}
                  </span>
                  <span>
                    출석 {filteredResults.filter((r) => r.checked_in_at).length} / 미출석 {filteredResults.filter((r) => !r.checked_in_at).length}
                  </span>
                </div>

                {searching && <p className="text-slate-400 text-sm text-center py-8">불러오는 중...</p>}

                <div className="flex flex-col gap-2">
                  {filteredResults.map((r) => (
                    <div key={r.id} className={`rounded-xl px-4 py-3 flex items-center justify-between ${r.checked_in_at ? 'bg-slate-800/60' : 'bg-slate-800'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{r.checked_in_at ? '✅' : '⬜'}</span>
                        <div>
                          <p className={`font-medium ${r.checked_in_at ? 'text-slate-400' : 'text-white'}`}>{r.name}</p>
                          <div className="flex gap-2 text-slate-500 text-xs mt-0.5">
                            {r.company && <span>{r.company}</span>}
                            {r.department && <span>{r.department}</span>}
                            {r.position && <span>{r.position}</span>}
                            <span className={r.attendance_type === 'online' ? 'text-violet-400' : 'text-indigo-400'}>
                              {r.attendance_type === 'online' ? '온라인' : '현장'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.checked_in_at ? (
                          <>
                            <span className="text-xs text-emerald-400">{new Date(r.checked_in_at).toLocaleTimeString('ko-KR')}</span>
                            <button
                              onClick={() => processUndo(r.id)}
                              className="text-xs text-slate-500 hover:text-red-400 px-2 py-1 rounded transition-colors"
                              title="출석 취소"
                            >
                              취소
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={async () => {
                              await processCheckin(r.id)
                              refreshAllRegistrations()
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-lg transition-colors"
                          >
                            출석 체크
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!searching && filteredResults.length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-8">등록된 참가자가 없습니다.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 우측 로그 패널 */}
        <div className="hidden lg:flex w-72 border-l border-slate-700 bg-slate-800 flex-col shrink-0">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <p className="text-sm font-medium">스캔 기록</p>
            <span className="text-xs text-slate-400">{logs.length}건</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">기록 없음</p>
            ) : (
              logs.map((log, i) => (
                <div key={`${log.id}-${i}`} className="px-4 py-3 border-b border-slate-700/50 flex items-start gap-3">
                  <span className="text-lg shrink-0 mt-0.5">{log.status === 'success' ? '✅' : '⚠️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium truncate">{log.name}</p>
                      {log.isWalkIn && <span className="text-xs bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded shrink-0">현장</span>}
                    </div>
                    {log.company && <p className="text-xs text-slate-400 truncate">{log.company}</p>}
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-slate-500">{log.time}</p>
                      {log.status === 'success' && (
                        <button
                          onClick={() => processUndo(log.id)}
                          className="text-xs text-slate-600 hover:text-red-400 transition-colors"
                          title="출석 취소"
                        >
                          취소
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 모바일 하단 로그 (최근 3건) */}
      {logs.length > 0 && (
        <div className="lg:hidden border-t border-slate-700 bg-slate-800 shrink-0">
          <div className="px-4 py-2 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">최근 스캔</p>
            <span className="text-xs text-slate-500">{logs.length}건</span>
          </div>
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
            {logs.slice(0, 5).map((log, i) => (
              <div key={`${log.id}-${i}`} className="shrink-0 bg-slate-700 rounded-lg px-3 py-2 flex items-center gap-2 min-w-0">
                <span className="text-sm">{log.status === 'success' ? '✅' : '⚠️'}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate max-w-24">{log.name}</p>
                  <p className="text-xs text-slate-500">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  )
}
