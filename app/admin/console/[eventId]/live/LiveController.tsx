'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Clock, LayoutDashboard, Monitor } from 'lucide-react'
import { useConsoleSync } from '@/app/admin/console/_components/useConsoleSync'
import SessionQueue from '@/app/admin/console/_components/SessionQueue'
import CurrentSessionPanel from '@/app/admin/console/_components/CurrentSessionPanel'
import ControlButtons from '@/app/admin/console/_components/ControlButtons'
import TimerPanel from '@/app/admin/console/_components/TimerPanel'
import ContentForm from '@/app/admin/console/_components/ContentForm'
import PrepChecklist from '@/app/admin/console/_components/PrepChecklist'
import AddSessionForm from '@/app/admin/console/_components/AddSessionForm'
import { useToast, ToastContainer } from '@/app/components/Toast'
import ConfirmModal from '@/app/components/ConfirmModal'
import { RealtimeStatusBadge, DisconnectedBanner } from '@/app/components/RealtimeStatus'
import type { Session, Track, TrackWithSessions } from '@/lib/types'

interface Event { id: string; name: string; event_date: string | null }
interface Props { event: Event; initialTracks: TrackWithSessions[] }

function toTrack(t: TrackWithSessions): Track {
  return { id: t.id, event_id: t.event_id, name: t.name, sort_order: t.sort_order, is_common: t.is_common, created_at: t.created_at }
}

function pickDefault(sessions: ReturnType<typeof useConsoleSync>['sessions']): string | null {
  const live = sessions.find((s) => ['live', 'paused', 'overtime', 'issue'].includes(s.timing.effective_status) && !s.completed_at)
  if (live) return live.id
  const ready = sessions.find((s) => s.timing.effective_status === 'ready')
  if (ready) return ready.id
  const upcoming = [...sessions]
    .filter((s) => !s.started_at && s.status !== 'cancelled' && s.planned_start_at)
    .sort((a, b) => new Date(a.planned_start_at as string).getTime() - new Date(b.planned_start_at as string).getTime())[0]
  return upcoming?.id ?? sessions[0]?.id ?? null
}

export default function LiveController({ event, initialTracks }: Props) {
  const { tracks, setTracks, sessions, connStatus } = useConsoleSync(event.id, initialTracks)
  const [manualSelectedId, setManualSelectedId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { toasts, show: showToast, dismiss } = useToast()

  const allTracks: Track[] = tracks.map(toTrack)

  // 사용자가 직접 고른 세션이 있으면 그것을, 없으면(또는 삭제되었으면) 자동으로 우선순위가 높은 세션을 선택
  const selectedId = (manualSelectedId && sessions.some((s) => s.id === manualSelectedId))
    ? manualSelectedId
    : pickDefault(sessions)
  const setSelectedId = setManualSelectedId

  const selected = sessions.find((s) => s.id === selectedId) ?? null

  const handlePatch = useCallback(async (patch: Partial<Session>) => {
    if (!selected) return
    setPending(true)
    try {
      const res = await fetch(`/api/admin/console/sessions/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? '업데이트에 실패했습니다.', 'error'); return }
      setTracks((prev) => prev.map((t) => ({ ...t, sessions: t.sessions.map((s) => (s.id === data.id ? { ...s, ...data } : s)) })))
    } catch {
      showToast('네트워크 오류가 발생했습니다.', 'error')
    } finally {
      setPending(false)
    }
  }, [selected, setTracks, showToast])

  const handleDelete = useCallback(async () => {
    if (!selected) return
    setPending(true)
    try {
      const res = await fetch(`/api/admin/console/sessions/${selected.id}`, { method: 'DELETE' })
      if (!res.ok) { showToast('삭제에 실패했습니다.', 'error'); return }
      setTracks((prev) => prev.map((t) => ({ ...t, sessions: t.sessions.filter((s) => s.id !== selected.id) })))
      setSelectedId(null)
    } finally {
      setPending(false)
    }
  }, [selected, setTracks, showToast, setSelectedId])

  // 스페이스바 → 진행 중인 세션 다음 장표
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space' || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const live = sessions.find((s) => s.timing.effective_status === 'live' || s.timing.effective_status === 'overtime')
      if (live && live.total_slides > 0) {
        e.preventDefault()
        const next = Math.min(live.current_slide + 1, live.total_slides)
        fetch(`/api/admin/console/sessions/${live.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_slide: next }),
        }).then((res) => res.json()).then((data) => {
          setTracks((prev) => prev.map((t) => ({ ...t, sessions: t.sessions.map((s) => (s.id === data.id ? { ...s, ...data } : s)) })))
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sessions, setTracks])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/console/${event.id}`} className="text-slate-400 hover:text-slate-700 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Monitor className="w-5 h-5 text-indigo-600" />
          <div>
            <h1 className="font-bold text-base text-slate-900">{event.name}</h1>
            {event.event_date && (
              <p className="text-slate-400 text-xs">{new Date(event.event_date).toLocaleString('ko-KR')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeStatusBadge status={connStatus} />
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span className="font-mono tabular-nums">{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <Link
            href={`/admin/console/${event.id}/dashboard`}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 border border-slate-300 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            관계자 대시보드
          </Link>
          <span className="text-xs text-slate-400">Space: 다음 장표{pending && ' · 저장 중...'}</span>
        </div>
      </header>

      <DisconnectedBanner status={connStatus} />

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Monitor className="w-12 h-12 opacity-30" />
            <p>트랙이 없습니다.</p>
            <Link href={`/admin/console/${event.id}`} className="text-sm text-indigo-600 hover:text-indigo-500 underline">
              콘솔 설정으로 이동
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_340px]">
            <div className="flex flex-col gap-3 lg:h-[calc(100vh-130px)]">
              <div className="min-h-0 flex-1">
                <SessionQueue sessions={sessions} selectedId={selectedId} onSelect={setSelectedId} />
              </div>
              <AddSessionForm
                tracks={allTracks}
                onCreated={(session) => {
                  setTracks((prev) => prev.map((t) => (t.id === session.track_id ? { ...t, sessions: [...t.sessions, session] } : t)))
                  setSelectedId(session.id)
                }}
              />
            </div>

            <div className="flex flex-col gap-4">
              {selected ? (
                <>
                  <CurrentSessionPanel
                    session={selected}
                    tracks={allTracks}
                    onPatch={handlePatch}
                    onDelete={() => setConfirmDelete(true)}
                  />
                  <ControlButtons session={selected} onPatch={handlePatch} />
                </>
              ) : (
                <p className="text-sm text-slate-500">세션을 선택하세요.</p>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {selected && (
                <>
                  <TimerPanel session={selected} />
                  <ContentForm session={selected} onPatch={handlePatch} />
                  <PrepChecklist session={selected} onPatch={handlePatch} />
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {confirmDelete && selected && (
        <ConfirmModal
          title="세션을 삭제할까요?"
          description={`"${selected.title}" · 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          variant="danger"
          onConfirm={() => { setConfirmDelete(false); handleDelete() }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
