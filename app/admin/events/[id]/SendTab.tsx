'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Event, Registration } from '@/lib/types'

interface Template {
  id: string
  name: string
  type: string
  is_default: boolean
  subject: string
}

type Step = 1 | 2 | 3

const TYPE_LABEL: Record<string, string> = {
  registration: '등록 완료',
  reminder: '리마인드',
  custom: '커스텀',
}
const TYPE_COLOR: Record<string, string> = {
  registration: 'bg-indigo-100 text-indigo-700',
  reminder: 'bg-amber-100 text-amber-700',
  custom: 'bg-slate-100 text-slate-600',
}

export default function SendTab({ event }: { event: Event }) {
  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [loadingTpl, setLoadingTpl] = useState(true)

  // Step 2
  const [filterAttendance, setFilterAttendance] = useState<'all' | 'offline' | 'online'>('all')
  const [filterCheckin, setFilterCheckin] = useState<'all' | 'checked' | 'unchecked'>('all')
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingRegs, setLoadingRegs] = useState(false)

  // Step 3
  const [sendMode, setSendMode] = useState<'immediate' | 'scheduled'>('immediate')
  const [scheduledAt, setScheduledAt] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ send_id: string; total: number; scheduled?: boolean } | null>(null)
  const [sendError, setSendError] = useState('')

  // 템플릿 로드
  useEffect(() => {
    fetch(`/api/events/${event.id}/templates`)
      .then((r) => r.json())
      .then((d) => { setTemplates(Array.isArray(d) ? d : []); setLoadingTpl(false) })
  }, [event.id])

  // 등록자 로드 (필터 변경 시)
  const loadRegistrations = useCallback(async () => {
    setLoadingRegs(true)
    const params = new URLSearchParams()
    if (filterAttendance !== 'all') params.set('attendance_type', filterAttendance)
    if (filterCheckin !== 'all') params.set('checkin', filterCheckin)
    const res = await fetch(`/api/events/${event.id}/registrations/search?${params}`)
    const data = await res.json()
    const list: Registration[] = Array.isArray(data) ? data : []
    setRegistrations(list)
    setSelectedIds(new Set(list.map((r) => r.id)))
    setLoadingRegs(false)
  }, [event.id, filterAttendance, filterCheckin])

  useEffect(() => {
    if (step === 2) loadRegistrations()
  }, [step, loadRegistrations])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === registrations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(registrations.map((r) => r.id)))
    }
  }

  async function handleSend() {
    if (!selectedTemplate) return
    if (sendMode === 'scheduled' && !scheduledAt) {
      setSendError('예약 발송 시각을 선택하세요.')
      return
    }
    setSending(true)
    setSendError('')
    try {
      const res = await fetch(`/api/events/${event.id}/sends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          registration_ids: Array.from(selectedIds),
          filter_config: { attendance_type: filterAttendance, checkin: filterCheckin },
          scheduled_at: sendMode === 'scheduled' ? new Date(scheduledAt).toISOString() : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '발송 실패')
      setResult({ ...data, scheduled: sendMode === 'scheduled' })
    } catch (e) {
      setSendError(e instanceof Error ? e.message : '발송 중 오류가 발생했습니다.')
    } finally {
      setSending(false)
    }
  }

  function reset() {
    setStep(1)
    setSelectedTemplate(null)
    setFilterAttendance('all')
    setFilterCheckin('all')
    setSelectedIds(new Set())
    setSendMode('immediate')
    setScheduledAt('')
    setResult(null)
    setSendError('')
  }

  // ── 발송 완료 화면 ─────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center flex flex-col items-center gap-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${result.scheduled ? 'bg-amber-100' : 'bg-green-100'}`}>
          {result.scheduled ? '🕐' : '✓'}
        </div>
        <div>
          <p className="font-bold text-lg text-slate-800">
            {result.scheduled ? '예약 발송 등록 완료' : '발송 요청 완료'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            총 <strong>{result.total}명</strong>에게{' '}
            {result.scheduled
              ? `${new Date(scheduledAt).toLocaleString('ko-KR')}에 발송 예정입니다.`
              : '이메일 발송을 시작했습니다.'}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            발송 결과는 &quot;발송 현황&quot; 탭에서 확인할 수 있습니다.
          </p>
        </div>
        <button onClick={reset}
          className="mt-2 text-sm px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
          새 발송 시작
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">

      {/* 단계 표시 */}
      <StepIndicator current={step} />

      {/* Step 1 — 템플릿 선택 */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-500">발송할 이메일 템플릿을 선택하세요.</p>

          {loadingTpl ? (
            <div className="text-sm text-slate-400 py-6 text-center">불러오는 중...</div>
          ) : templates.length === 0 ? (
            <div className="bg-slate-50 rounded-xl p-6 text-center text-sm text-slate-400">
              템플릿이 없습니다. 먼저 &quot;템플릿 관리&quot; 탭에서 템플릿을 만들어주세요.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {templates.map((tpl) => (
                <button key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`text-left p-4 rounded-xl border-2 transition-colors ${
                    selectedTemplate?.id === tpl.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[tpl.type]}`}>
                      {TYPE_LABEL[tpl.type] ?? tpl.type}
                    </span>
                    <span className="font-semibold text-sm">{tpl.name}</span>
                    {selectedTemplate?.id === tpl.id && (
                      <span className="ml-auto text-indigo-600 text-sm">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{tpl.subject}</p>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={() => setStep(2)} disabled={!selectedTemplate}
              className="px-6 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors">
              다음 — 수신자 선택 →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — 수신자 선택 */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">발송받을 대상을 선택하세요.</p>
            <button onClick={() => setStep(1)}
              className="text-xs text-slate-400 hover:text-slate-600">← 이전</button>
          </div>

          {/* 필터 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">참석 방식</p>
              <div className="flex gap-2">
                {(['all', 'offline', 'online'] as const).map((v) => (
                  <button key={v} onClick={() => setFilterAttendance(v)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      filterAttendance === v
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    {v === 'all' ? '전체' : v === 'offline' ? '현장' : '온라인'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">체크인 여부</p>
              <div className="flex gap-2">
                {(['all', 'checked', 'unchecked'] as const).map((v) => (
                  <button key={v} onClick={() => setFilterCheckin(v)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      filterCheckin === v
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    {v === 'all' ? '전체' : v === 'checked' ? '체크인 완료' : '미체크인'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 등록자 목록 */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
              <input type="checkbox" checked={selectedIds.size === registrations.length && registrations.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-xs text-slate-500 font-medium">
                {loadingRegs ? '불러오는 중...' : `${registrations.length}명 중 ${selectedIds.size}명 선택`}
              </span>
            </div>

            {/* 목록 */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {loadingRegs ? (
                <div className="py-8 text-center text-sm text-slate-400">불러오는 중...</div>
              ) : registrations.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">해당하는 등록자가 없습니다.</div>
              ) : (
                registrations.map((r) => (
                  <label key={r.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-800">{r.name}</span>
                      {r.company && (
                        <span className="text-xs text-slate-400 ml-2">{r.company}</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 truncate max-w-48">{r.email}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      r.attendance_type === 'online'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {r.attendance_type === 'online' ? '온라인' : '현장'}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => setStep(3)} disabled={selectedIds.size === 0}
              className="px-6 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors">
              다음 — 발송 확인 →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — 발송 확인 */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">발송 내용을 최종 확인하세요.</p>
            <button onClick={() => setStep(2)}
              className="text-xs text-slate-400 hover:text-slate-600">← 이전</button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            <SummaryRow label="템플릿">
              <span className="font-medium">{selectedTemplate?.name}</span>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${TYPE_COLOR[selectedTemplate?.type ?? 'custom']}`}>
                {TYPE_LABEL[selectedTemplate?.type ?? 'custom']}
              </span>
            </SummaryRow>
            <SummaryRow label="메일 제목">
              <span className="text-slate-700">{selectedTemplate?.subject}</span>
            </SummaryRow>
            <SummaryRow label="수신자">
              <span className="font-semibold text-indigo-700">{selectedIds.size}명</span>
            </SummaryRow>
          </div>

          {/* 발송 방식 선택 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
            <p className="text-xs font-medium text-slate-500">발송 시각</p>
            <div className="flex gap-3">
              <button onClick={() => setSendMode('immediate')}
                className={`flex-1 py-2.5 text-sm rounded-lg border-2 font-medium transition-colors ${
                  sendMode === 'immediate'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}>
                즉시 발송
              </button>
              <button onClick={() => setSendMode('scheduled')}
                className={`flex-1 py-2.5 text-sm rounded-lg border-2 font-medium transition-colors ${
                  sendMode === 'scheduled'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}>
                예약 발송
              </button>
            </div>

            {sendMode === 'scheduled' && (
              <div>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  선택한 시각에 Vercel Cron이 자동으로 발송합니다.
                </p>
              </div>
            )}
          </div>

          {sendError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {sendError}
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleSend} disabled={sending}
              className="px-8 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
              {sending
                ? '처리 중...'
                : sendMode === 'scheduled'
                ? `${selectedIds.size}명 예약 발송 등록`
                : `${selectedIds.size}명에게 즉시 발송`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 공통 컴포넌트 ─────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps = ['템플릿 선택', '수신자 선택', '발송 확인']
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const n = (i + 1) as Step
        const active = n === current
        const done = n < current
        return (
          <div key={n} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${
              active ? 'text-indigo-700' : done ? 'text-slate-400' : 'text-slate-300'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                active ? 'bg-indigo-600 text-white' : done ? 'bg-slate-300 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {done ? '✓' : n}
              </span>
              {label}
            </div>
            {i < 2 && <span className="text-slate-200 text-xs">—</span>}
          </div>
        )
      })}
    </div>
  )
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <span className="text-xs text-slate-400 w-20 flex-shrink-0">{label}</span>
      <div className="flex items-center flex-wrap gap-1 text-sm">{children}</div>
    </div>
  )
}
