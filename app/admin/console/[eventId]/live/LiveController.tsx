'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Play, Square, ChevronRight, ChevronLeft,
  Clock, RotateCcw, Monitor, Layers, LayoutDashboard
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { calcDelay, elapsedSeconds, formatDuration } from '@/lib/console-utils'
import type { TrackWithSessions, Session } from '@/lib/types'
import { useToast, ToastContainer } from '@/app/components/Toast'
import ConfirmModal from '@/app/components/ConfirmModal'
import { RealtimeStatusBadge, DisconnectedBanner } from '@/app/components/RealtimeStatus'
import type { ConnectionStatus } from '@/app/components/RealtimeStatus'

interface Event { id: string; name: string; event_date: string | null }
interface Props { event: Event; initialTracks: TrackWithSessions[] }

type PendingAction = {
  sessionId: string
  action: 'start' | 'end'
  sessionTitle: string
}

function DelayBadge({ session, now }: { session: Session; now: Date }) {
  const delay = calcDelay(session, now)
  if (!delay) return null
  const base = 'text-xs font-mono font-bold px-2 py-0.5 rounded-full'
  if (delay.status === 'on-time') return <span className={`${base} bg-green-100 text-green-700`}>{delay.label}</span>
  if (delay.status === 'warning') return <span className={`${base} bg-yellow-100 text-yellow-700`}>{delay.label}</span>
  return <span className={`${base} bg-red-100 text-red-700 animate-pulse`}>{delay.label}</span>
}

function ElapsedTimer({ session, now }: { session: Session; now: Date }) {
  const secs = elapsedSeconds(session, now)
  return <span className="font-mono text-sm text-slate-500">경과 {formatDuration(secs)}</span>
}

function TrackCard({
  track, now, onRequestAction, onDirectAction, loading,
}: {
  track: TrackWithSessions
  now: Date
  onRequestAction: (sessionId: string, action: 'start' | 'end', title: string) => void
  onDirectAction: (sessionId: string, action: 'next-slide' | 'reset') => void
  loading: string | null
}) {
  const liveSession = track.sessions.find((s) => s.status === 'live')
  const nextSession = track.sessions.find((s) => s.status === 'ready')
  const current = liveSession ?? nextSession

  const delay = liveSession ? calcDelay(liveSession, now) : null
  const borderColor =
    !liveSession ? 'border-slate-700' :
    delay?.status === 'danger' ? 'border-red-400' :
    delay?.status === 'warning' ? 'border-yellow-400' :
    'border-green-400'

  const headerBg =
    !liveSession ? 'bg-slate-800' :
    delay?.status === 'danger' ? 'bg-red-700' :
    delay?.status === 'warning' ? 'bg-yellow-600' :
    'bg-green-700'

  const completedCount = track.sessions.filter((s) => s.status === 'completed').length

  return (
    <div className={`flex flex-col bg-slate-900 rounded-2xl border-2 overflow-hidden ${borderColor}`}>
      <div className={`px-4 py-3 ${headerBg} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-white/70" />
          <span className="font-bold text-white text-sm">{track.name}</span>
        </div>
        <span className="text-xs text-white/60">{completedCount}/{track.sessions.length} 완료</span>
      </div>

      <div className="flex-1 px-4 py-4">
        {!current ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-500 gap-2">
            <Monitor className="w-8 h-8 opacity-30" />
            <span className="text-sm">모든 세션 완료</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              {liveSession ? (
                <span className="flex items-center gap-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  LIVE
                </span>
              ) : (
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">NEXT</span>
              )}
              {liveSession && <DelayBadge session={liveSession} now={now} />}
            </div>

            <h3 className="text-white font-semibold text-base leading-tight mb-1">{current.title}</h3>
            {current.speaker && <p className="text-slate-400 text-sm mb-2">{current.speaker}</p>}

            {liveSession && liveSession.total_slides > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>슬라이드</span>
                  <span className="font-mono font-bold text-white">
                    {liveSession.current_slide} / {liveSession.total_slides}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full transition-all duration-300"
                    style={{ width: `${(liveSession.current_slide / liveSession.total_slides) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
              {(current.planned_start_at || current.planned_end_at) && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {current.planned_start_at
                    ? new Date(current.planned_start_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                    : '--'}
                  {' ~ '}
                  {current.planned_end_at
                    ? new Date(current.planned_end_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                    : '--'}
                </span>
              )}
              {liveSession && <ElapsedTimer session={liveSession} now={now} />}
            </div>

            {current.rehearsal_notes && (
              <p className="text-xs text-amber-300 bg-amber-900/30 rounded px-2 py-1.5 mb-3 line-clamp-2">
                📋 {current.rehearsal_notes}
              </p>
            )}

            <div className="flex gap-2">
              {!liveSession ? (
                <button
                  onClick={() => onRequestAction(current.id, 'start', current.title)}
                  disabled={!!loading}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex-1 justify-center"
                >
                  <Play className="w-4 h-4" />
                  세션 시작
                </button>
              ) : (
                <>
                  {liveSession.total_slides > 0 && (
                    <button
                      onClick={() => onDirectAction(liveSession.id, 'next-slide')}
                      disabled={!!loading || liveSession.current_slide >= liveSession.total_slides}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-40 flex-1 justify-center"
                    >
                      <ChevronRight className="w-4 h-4" />
                      다음 장표
                    </button>
                  )}
                  <button
                    onClick={() => onRequestAction(liveSession.id, 'end', liveSession.title)}
                    disabled={!!loading}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Square className="w-4 h-4" />
                    종료
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {track.sessions.length > 0 && (
        <div className="border-t border-slate-700 px-4 py-2">
          <div className="flex flex-col gap-0.5">
            {track.sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs py-0.5">
                <span className={`truncate max-w-[160px] ${
                  s.status === 'live' ? 'text-green-400 font-medium' :
                  s.status === 'completed' ? 'text-slate-600 line-through' :
                  'text-slate-400'
                }`}>
                  {s.title}
                </span>
                {s.status === 'completed' && (
                  <button
                    onClick={() => onDirectAction(s.id, 'reset')}
                    className="text-slate-600 hover:text-slate-400 transition-colors ml-2"
                    title="초기화"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function LiveController({ event, initialTracks }: Props) {
  const [tracks, setTracks] = useState<TrackWithSessions[]>(initialTracks)
  const [now, setNow] = useState(new Date())
  const [loading, setLoading] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('connecting')
  const { toasts, show: showToast, dismiss } = useToast()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Realtime 구독 + 연결 상태 추적
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel(`live-${event.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions' },
        (payload) => {
          const updated = payload.new as Session
          setTracks((prev) =>
            prev.map((t) => ({
              ...t,
              sessions: t.sessions.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
            }))
          )
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnStatus('connected')
        else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setConnStatus('disconnected')
        else setConnStatus('connecting')
      })

    return () => { supabase.removeChannel(channel) }
  }, [event.id])

  // Space bar → 첫 번째 live 세션 다음 장표
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space' || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      e.preventDefault()
      const liveSession = tracks.flatMap((t) => t.sessions).find((s) => s.status === 'live')
      if (liveSession && liveSession.total_slides > 0) {
        executeAction(liveSession.id, 'next-slide')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks])

  const executeAction = useCallback(async (sessionId: string, action: 'start' | 'next-slide' | 'end' | 'reset') => {
    setLoading(sessionId)
    try {
      const res = await fetch(`/api/admin/console/sessions/${sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error ?? '액션 처리에 실패했습니다.', 'error')
      } else {
        setTracks((prev) =>
          prev.map((t) => ({
            ...t,
            sessions: t.sessions.map((s) => (s.id === data.id ? { ...s, ...data } : s)),
          }))
        )
      }
    } catch {
      showToast('네트워크 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(null)
    }
  }, [showToast])

  // 시작/종료는 확인 모달 경유
  function requestAction(sessionId: string, action: 'start' | 'end', sessionTitle: string) {
    setPending({ sessionId, action, sessionTitle })
  }

  function handleConfirm() {
    if (!pending) return
    executeAction(pending.sessionId, pending.action)
    setPending(null)
  }

  const gridCols =
    tracks.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' :
    tracks.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
    tracks.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
    'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/admin/console/${event.id}`} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Monitor className="w-5 h-5 text-green-400" />
          <div>
            <h1 className="font-bold text-base">{event.name}</h1>
            {event.event_date && (
              <p className="text-slate-400 text-xs">{new Date(event.event_date).toLocaleString('ko-KR')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeStatusBadge status={connStatus} />
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="font-mono">
              {now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <Link
            href={`/admin/console/${event.id}/dashboard`}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            관계자 대시보드
          </Link>
          <span className="text-xs text-slate-600">Space: 다음 장표</span>
        </div>
      </header>

      <DisconnectedBanner status={connStatus} />

      <main className="flex-1 p-6">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
            <Monitor className="w-12 h-12 opacity-20" />
            <p>트랙이 없습니다.</p>
            <Link href={`/admin/console/${event.id}`} className="text-sm text-indigo-400 hover:text-indigo-300 underline">
              콘솔 설정으로 이동
            </Link>
          </div>
        ) : (
          <div className={`grid gap-4 ${gridCols}`}>
            {tracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                now={now}
                onRequestAction={requestAction}
                onDirectAction={(id, action) => executeAction(id, action)}
                loading={loading}
              />
            ))}
          </div>
        )}
      </main>

      {/* 확인 모달 */}
      {pending && (
        <ConfirmModal
          title={pending.action === 'start' ? '세션을 시작할까요?' : '세션을 종료할까요?'}
          description={`"${pending.sessionTitle}"`}
          confirmLabel={pending.action === 'start' ? '시작' : '종료'}
          variant={pending.action === 'end' ? 'danger' : 'primary'}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
