'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, Monitor, ChevronLeft, Layers, CheckCircle2, Circle, Radio } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { calcDelay, elapsedSeconds, formatDuration } from '@/lib/console-utils'
import type { TrackWithSessions, Session, DelayStatus } from '@/lib/types'
import { RealtimeStatusBadge, DisconnectedBanner } from '@/app/components/RealtimeStatus'
import type { ConnectionStatus } from '@/app/components/RealtimeStatus'

interface Event { id: string; name: string; event_date: string | null }
interface Props { event: Event; initialTracks: TrackWithSessions[] }

// ── 신호등 설정 ────────────────────────────────────────────────────────────

const SIGNAL: Record<DelayStatus | 'idle', {
  bar: string; glow: string; badge: string; label: string; dot: string
}> = {
  'idle':     { bar: 'bg-slate-600',  glow: '',                         badge: 'bg-slate-700 text-slate-300',   label: '대기 중',    dot: 'bg-slate-500' },
  'on-time':  { bar: 'bg-green-500',  glow: 'shadow-[0_0_24px_#22c55e]', badge: 'bg-green-900 text-green-300',  label: '정시 진행',  dot: 'bg-green-400' },
  'warning':  { bar: 'bg-yellow-400', glow: 'shadow-[0_0_24px_#facc15]', badge: 'bg-yellow-900 text-yellow-300', label: '지연 주의', dot: 'bg-yellow-400 animate-pulse' },
  'danger':   { bar: 'bg-red-500',    glow: 'shadow-[0_0_32px_#ef4444]', badge: 'bg-red-900 text-red-300',      label: '시간 초과',  dot: 'bg-red-500 animate-ping' },
}

function getSignalKey(session: Session | null, now: Date): DelayStatus | 'idle' {
  if (!session || session.status !== 'live') return 'idle'
  const delay = calcDelay(session, now)
  return delay?.status ?? 'on-time'
}

// ── 전체 상태 요약 ─────────────────────────────────────────────────────────

function OverallStatus({ tracks, now }: { tracks: TrackWithSessions[]; now: Date }) {
  const liveSessions = tracks.flatMap((t) => t.sessions).filter((s) => s.status === 'live')
  const delays = liveSessions.map((s) => calcDelay(s, now))
  const hasDanger  = delays.some((d) => d?.status === 'danger')
  const hasWarning = delays.some((d) => d?.status === 'warning')

  const key: DelayStatus | 'idle' =
    hasDanger ? 'danger' : hasWarning ? 'warning' : liveSessions.length > 0 ? 'on-time' : 'idle'
  const sig = SIGNAL[key]

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${sig.badge}`}>
      <span className={`w-2 h-2 rounded-full ${sig.dot}`} />
      <span className="text-xs font-medium">{sig.label}</span>
      {liveSessions.length > 0 && (
        <span className="text-xs opacity-60">{liveSessions.length}개 진행 중</span>
      )}
    </div>
  )
}

// ── 세션 진행 미니맵 ───────────────────────────────────────────────────────

function SessionMinimap({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) return null
  return (
    <div className="flex gap-1 flex-wrap">
      {sessions.map((s) => (
        <div
          key={s.id}
          title={s.title}
          className={`w-2.5 h-2.5 rounded-sm ${
            s.status === 'completed' ? 'bg-slate-600' :
            s.status === 'live'      ? 'bg-green-400' :
            'bg-slate-700'
          }`}
        />
      ))}
    </div>
  )
}

// ── 트랙 카드 ──────────────────────────────────────────────────────────────

function TrackCard({ track, now, isSingle }: { track: TrackWithSessions; now: Date; isSingle: boolean }) {
  const liveSession = track.sessions.find((s) => s.status === 'live') ?? null
  const nextSession = track.sessions.find((s) => s.status === 'ready') ?? null
  const current = liveSession ?? nextSession

  const sigKey = getSignalKey(liveSession, now)
  const sig = SIGNAL[sigKey]

  const delay = liveSession ? calcDelay(liveSession, now) : null
  const elapsed = liveSession ? elapsedSeconds(liveSession, now) : 0

  const completedCount = track.sessions.filter((s) => s.status === 'completed').length

  return (
    <div className={`flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 ${sig.glow} transition-all duration-700`}>

      {/* 신호등 바 */}
      <div className={`h-1.5 w-full ${sig.bar} transition-colors duration-700`} />

      {/* 트랙 헤더 */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <span className="text-slate-300 font-semibold text-sm">{track.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${sig.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sig.dot}`} />
            {sig.label}
          </span>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 px-5 py-3">
        {!current ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-600">
            <CheckCircle2 className="w-10 h-10" />
            <span className="text-sm">모든 세션 완료</span>
          </div>
        ) : (
          <>
            {/* 라이브 여부 */}
            <div className="flex items-center gap-2 mb-2">
              {liveSession ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-400">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  LIVE NOW
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Circle className="w-3 h-3" />
                  NEXT UP
                </span>
              )}
              {liveSession && delay && (
                <span className={`font-mono font-bold text-sm ${
                  delay.status === 'danger'  ? 'text-red-400' :
                  delay.status === 'warning' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {delay.label}
                </span>
              )}
            </div>

            {/* 세션 제목 */}
            <h2 className={`font-bold leading-tight mb-1 ${isSingle ? 'text-3xl' : 'text-xl'} text-white`}>
              {current.title}
            </h2>

            {/* 발표자 */}
            {current.speaker && (
              <p className={`text-slate-400 mb-3 ${isSingle ? 'text-lg' : 'text-sm'}`}>
                {current.speaker}
              </p>
            )}

            {/* 슬라이드 진행률 */}
            {liveSession && liveSession.total_slides > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>슬라이드 진행률</span>
                  <span className={`font-mono font-bold ${isSingle ? 'text-base' : 'text-xs'} text-white`}>
                    {liveSession.current_slide} / {liveSession.total_slides}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((liveSession.current_slide / liveSession.total_slides) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* 시간 정보 */}
            <div className={`flex flex-wrap gap-4 ${isSingle ? 'text-base' : 'text-xs'} text-slate-400`}>
              {(current.planned_start_at || current.planned_end_at) && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {current.planned_start_at
                    ? new Date(current.planned_start_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                    : '--'}
                  {' ~ '}
                  {current.planned_end_at
                    ? new Date(current.planned_end_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                    : '--'}
                </span>
              )}
              {liveSession && (
                <span className="font-mono text-slate-400">
                  경과 {formatDuration(elapsed)}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* 세션 미니맵 + 완료 카운트 */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800">
        <SessionMinimap sessions={track.sessions} />
        <span className="text-xs text-slate-600">
          {completedCount}/{track.sessions.length} 완료
        </span>
      </div>
    </div>
  )
}

// ── 메인 대시보드 ──────────────────────────────────────────────────────────

export default function DashboardView({ event, initialTracks }: Props) {
  const [tracks, setTracks] = useState<TrackWithSessions[]>(initialTracks)
  const [now, setNow] = useState(new Date())
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('connecting')

  // 1초 타이머
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Supabase Realtime 구독
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel(`dashboard-${event.id}`)
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

  const isSingle = tracks.length === 1
  const gridCols =
    tracks.length <= 1 ? '' :
    tracks.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
    tracks.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
    'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* 헤더 */}
      <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/console/${event.id}/live`}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Monitor className="w-5 h-5 text-slate-400" />
          <div>
            <h1 className="font-bold text-base">{event.name}</h1>
            {event.event_date && (
              <p className="text-slate-500 text-xs">
                {new Date(event.event_date).toLocaleString('ko-KR')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <RealtimeStatusBadge status={connStatus} />
          <OverallStatus tracks={tracks} now={now} />
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm tabular-nums">
              {now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </header>

      <DisconnectedBanner status={connStatus} />

      {/* 신호등 범례 */}
      <div className="flex items-center gap-4 px-6 py-2 border-b border-slate-900 bg-slate-950">
        {(['on-time', 'warning', 'danger'] as const).map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${SIGNAL[key].bar}`} />
            <span className="text-xs text-slate-500">{SIGNAL[key].label}</span>
          </div>
        ))}
        <span className="text-xs text-slate-700 ml-auto">Realtime 동기화 중</span>
      </div>

      {/* 트랙 그리드 */}
      <main className="flex-1 p-6">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
            <Monitor className="w-12 h-12 opacity-20" />
            <p>트랙이 없습니다.</p>
          </div>
        ) : isSingle ? (
          <div className="max-w-2xl mx-auto h-full">
            <TrackCard track={tracks[0]} now={now} isSingle={true} />
          </div>
        ) : (
          <div className={`grid gap-4 ${gridCols}`}>
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} now={now} isSingle={false} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
