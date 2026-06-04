'use client'

import { useEffect, useRef, useState } from 'react'

interface CheckinResult {
  status: 'success' | 'already' | 'error'
  name?: string
  company?: string
  department?: string
  position?: string
  attendance_type?: string
  checked_in_at?: string
  message?: string
}

interface RecentLog {
  id: string
  name: string
  company: string | null
  status: 'success' | 'already'
  time: string
}

export default function CheckinClient({
  event,
}: {
  event: { id: string; name: string; event_date: string | null }
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [logs, setLogs] = useState<RecentLog[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 페이지 열리면 입력창 포커스
  useEffect(() => {
    inputRef.current?.focus()

    // 전체 출석 수 초기 로드
    fetch(`/api/events/${event.id}/checkin-stats`)
      .then((r) => r.json())
      .then((d) => setTotalCount(d.count ?? 0))
      .catch(() => {})
  }, [event.id])

  // 클릭해도 포커스 복구
  function refocus() {
    inputRef.current?.focus()
  }

  function extractRegistrationId(raw: string): string | null {
    const trimmed = raw.trim()
    // URL 형태: https://domain.com/attend/UUID
    const urlMatch = trimmed.match(/\/attend\/([a-f0-9-]{36})/)
    if (urlMatch) return urlMatch[1]
    // UUID만 입력된 경우
    const uuidMatch = trimmed.match(/^[a-f0-9-]{36}$/)
    if (uuidMatch) return trimmed
    return null
  }

  async function handleScan(raw: string) {
    if (processing) return
    const registrationId = extractRegistrationId(raw)

    if (!registrationId) {
      setResult({ status: 'error', message: '올바른 QR코드가 아닙니다.' })
      scheduleReset()
      return
    }

    setProcessing(true)
    setResult(null)

    const res = await fetch(`/api/registrations/${registrationId}/checkin`, { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      setResult({
        status: 'success',
        name: data.name,
        company: data.company,
        department: data.department,
        position: data.position,
        attendance_type: data.attendance_type,
        checked_in_at: data.checked_in_at,
      })
      setTotalCount((n) => n + 1)
      setLogs((prev) => [
        { id: registrationId, name: data.name, company: data.company, status: 'success', time: new Date().toLocaleTimeString('ko-KR') },
        ...prev.slice(0, 19),
      ])
    } else if (res.status === 400 && data.checked_in_at) {
      // 이미 출석 처리된 경우
      const info = await fetch(`/api/registrations/${registrationId}`).then((r) => r.json()).catch(() => ({}))
      setResult({
        status: 'already',
        name: info.name,
        company: info.company,
        checked_in_at: data.checked_in_at,
        message: data.error,
      })
      setLogs((prev) => [
        { id: registrationId, name: info.name ?? '알 수 없음', company: info.company, status: 'already', time: new Date().toLocaleTimeString('ko-KR') },
        ...prev.slice(0, 19),
      ])
    } else {
      setResult({ status: 'error', message: data.error ?? '처리 실패' })
    }

    setProcessing(false)
    scheduleReset()
  }

  function scheduleReset() {
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => {
      setResult(null)
      inputRef.current?.focus()
    }, 3000)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const val = inputRef.current?.value ?? ''
      if (inputRef.current) inputRef.current.value = ''
      if (val.trim()) handleScan(val)
    }
  }

  const resultBg =
    result?.status === 'success' ? 'bg-emerald-500' :
    result?.status === 'already' ? 'bg-amber-400' :
    result?.status === 'error'   ? 'bg-red-500' : ''

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col" onClick={refocus}>
      {/* 헤더 */}
      <header className="border-b border-slate-700 px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <p className="text-slate-400 text-xs mb-0.5">출석 체크</p>
          <h1 className="font-bold text-lg">{event.name}</h1>
          {event.event_date && (
            <p className="text-slate-400 text-xs">{new Date(event.event_date).toLocaleString('ko-KR')}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs mb-0.5">출석 완료</p>
          <p className="text-3xl font-bold text-emerald-400">{totalCount}명</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 메인 스캔 영역 */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">

          {/* 스캔 결과 */}
          {result ? (
            <div className={`w-full max-w-md rounded-2xl p-8 text-center transition-all ${resultBg}`}>
              {result.status === 'success' && (
                <>
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-2xl font-bold mb-2">{result.name}</p>
                  {result.company && <p className="text-white/80 text-lg mb-1">{result.company}</p>}
                  <div className="flex justify-center gap-2 text-white/70 text-sm mb-4">
                    {result.department && <span>{result.department}</span>}
                    {result.department && result.position && <span>·</span>}
                    {result.position && <span>{result.position}</span>}
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${result.attendance_type === 'online' ? 'bg-white/20' : 'bg-white/20'}`}>
                    {result.attendance_type === 'online' ? '🌐 온라인' : '🏢 현장'} 참석
                  </span>
                  <p className="text-white/60 text-xs mt-4">출석 처리 완료</p>
                </>
              )}
              {result.status === 'already' && (
                <>
                  <div className="text-6xl mb-4">⚠️</div>
                  <p className="text-2xl font-bold mb-2">{result.name ?? '이미 출석'}</p>
                  <p className="text-white/80 mb-2">{result.company}</p>
                  <p className="text-white/70 text-sm">
                    {result.checked_in_at && `${new Date(result.checked_in_at).toLocaleTimeString('ko-KR')}에 출석 완료`}
                  </p>
                </>
              )}
              {result.status === 'error' && (
                <>
                  <div className="text-6xl mb-4">❌</div>
                  <p className="text-xl font-bold">{result.message}</p>
                </>
              )}
            </div>
          ) : (
            <div className="w-full max-w-md text-center">
              <div className="w-32 h-32 border-4 border-dashed border-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">📷</span>
              </div>
              <p className="text-slate-300 text-xl font-medium mb-2">
                {processing ? '처리 중...' : 'QR코드를 스캔해 주세요'}
              </p>
              <p className="text-slate-500 text-sm">USB 스캐너로 QR코드를 스캔하면 자동으로 출석 처리됩니다</p>
            </div>
          )}

          {/* 숨겨진 입력창 (스캐너 입력 캡처) */}
          <input
            ref={inputRef}
            onKeyDown={handleKeyDown}
            className="opacity-0 absolute w-0 h-0"
            autoFocus
            autoComplete="off"
            readOnly={processing}
          />
        </div>

        {/* 우측: 최근 스캔 로그 */}
        <div className="w-72 border-l border-slate-700 bg-slate-800 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-sm font-medium">최근 스캔 기록</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">스캔 기록이 없습니다</p>
            ) : (
              logs.map((log, i) => (
                <div key={`${log.id}-${i}`} className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-3">
                  <span className="text-lg shrink-0">
                    {log.status === 'success' ? '✅' : '⚠️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{log.name}</p>
                    {log.company && <p className="text-xs text-slate-400 truncate">{log.company}</p>}
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{log.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
