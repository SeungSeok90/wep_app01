'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Event } from '@/lib/types'

interface SendRecord {
  id: string
  template_name: string
  subject: string
  status: 'pending' | 'scheduled' | 'sending' | 'completed' | 'failed'
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  total_count: number
  success_count: number
  fail_count: number
  created_at: string
}

interface SendLog {
  id: string
  email: string
  status: 'pending' | 'sent' | 'failed'
  error_message: string | null
  sent_at: string | null
}

const STATUS_LABEL: Record<string, string> = {
  pending:   '대기',
  scheduled: '예약됨',
  sending:   '발송 중',
  completed: '완료',
  failed:    '실패',
}

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-slate-100 text-slate-500',
  scheduled: 'bg-amber-100 text-amber-700',
  sending:   'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-600',
}

export default function HistoryTab({ event }: { event: Event }) {
  const [sends, setSends] = useState<SendRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<string | null>(null)
  const [logs, setLogs] = useState<SendLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/events/${event.id}/sends`)
    const data = await res.json()
    setSends(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [event.id])

  useEffect(() => { load() }, [load])

  async function openDetail(sendId: string) {
    setDetail(sendId)
    setLoadingLogs(true)
    const res = await fetch(`/api/events/${event.id}/sends/${sendId}/logs`)
    const data = await res.json()
    setLogs(Array.isArray(data) ? data : [])
    setLoadingLogs(false)
  }

  const selectedSend = sends.find((s) => s.id === detail)

  return (
    <div className="flex flex-col gap-4">

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">이메일 발송 이력을 확인합니다.</p>
        <button onClick={load}
          className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          새로고침
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400 py-8 text-center">불러오는 중...</div>
      ) : sends.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
          아직 발송 이력이 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sends.map((s) => (
            <div key={s.id}
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                  <span className="font-semibold text-sm truncate">{s.template_name}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{s.subject}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {s.status === 'scheduled' && s.scheduled_at
                    ? `예약: ${new Date(s.scheduled_at).toLocaleString('ko-KR')}`
                    : s.completed_at
                    ? `완료: ${new Date(s.completed_at).toLocaleString('ko-KR')}`
                    : s.started_at
                    ? `시작: ${new Date(s.started_at).toLocaleString('ko-KR')}`
                    : `등록: ${new Date(s.created_at).toLocaleString('ko-KR')}`}
                </p>
              </div>

              {/* 통계 */}
              <div className="flex gap-3 text-center flex-shrink-0">
                <div>
                  <p className="text-base font-bold text-slate-800">{s.total_count}</p>
                  <p className="text-xs text-slate-400">전체</p>
                </div>
                <div>
                  <p className="text-base font-bold text-green-600">{s.success_count}</p>
                  <p className="text-xs text-slate-400">성공</p>
                </div>
                {s.fail_count > 0 && (
                  <div>
                    <p className="text-base font-bold text-red-500">{s.fail_count}</p>
                    <p className="text-xs text-slate-400">실패</p>
                  </div>
                )}
              </div>

              <button onClick={() => openDetail(s.id)}
                className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0">
                상세
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      {detail && selectedSend && (
        <DetailModal
          send={selectedSend}
          logs={logs}
          loading={loadingLogs}
          onClose={() => { setDetail(null); setLogs([]) }}
        />
      )}
    </div>
  )
}

function DetailModal({
  send,
  logs,
  loading,
  onClose,
}: {
  send: SendRecord
  logs: SendLog[]
  loading: boolean
  onClose: () => void
}) {
  const successRate = send.total_count > 0
    ? Math.round((send.success_count / send.total_count) * 100)
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">

        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[send.status]}`}>
                  {STATUS_LABEL[send.status]}
                </span>
                <h2 className="font-bold text-base">{send.template_name}</h2>
              </div>
              <p className="text-xs text-slate-500">{send.subject}</p>
            </div>
            <button onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-sm px-3 py-1.5 hover:bg-slate-100 rounded-lg flex-shrink-0">
              닫기
            </button>
          </div>

          {/* 요약 통계 */}
          <div className="flex gap-4 mt-4">
            <StatBox label="전체" value={send.total_count} color="text-slate-800" />
            <StatBox label="성공" value={send.success_count} color="text-green-600" />
            <StatBox label="실패" value={send.fail_count} color="text-red-500" />
            <StatBox label="성공률" value={`${successRate}%`} color="text-indigo-600" />
          </div>

          {/* 진행률 바 */}
          {send.total_count > 0 && (
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${successRate}%` }}
              />
            </div>
          )}
        </div>

        {/* 수신자 목록 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">불러오는 중...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">수신자 데이터가 없습니다.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    log.status === 'sent' ? 'bg-green-500'
                    : log.status === 'failed' ? 'bg-red-500'
                    : 'bg-slate-300'
                  }`} />
                  <span className="text-sm text-slate-700 flex-1 truncate">{log.email}</span>
                  {log.status === 'sent' && log.sent_at && (
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(log.sent_at).toLocaleTimeString('ko-KR')}
                    </span>
                  )}
                  {log.status === 'failed' && (
                    <span className="text-xs text-red-400 flex-shrink-0 max-w-32 truncate">
                      {log.error_message ?? '실패'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2 text-center min-w-14">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  )
}
