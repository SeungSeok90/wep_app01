'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Monitor, Plus, Trash2, Edit2, Play, ChevronLeft,
  Clock, FileText, User, SlidersHorizontal, Save, X, LayoutGrid, LayoutDashboard
} from 'lucide-react'
import type { TrackWithSessions, Session, Track } from '@/lib/types'
import { useConsoleSync } from '../_components/useConsoleSync'
import { computeKpis } from '@/lib/session-logic'
import KpiBar from '../_components/KpiBar'
import MorningTimeline from '../_components/MorningTimeline'
import TrackGrid from '../_components/TrackGrid'
import { RealtimeStatusBadge } from '@/app/components/RealtimeStatus'

interface Event { id: string; name: string; event_date: string | null }

type Tab = 'setup' | 'overview'

interface Props {
  event: Event
  initialTracks: TrackWithSessions[]
  initialTab?: Tab
}

function toTrack(t: TrackWithSessions): Track {
  return { id: t.id, event_id: t.event_id, name: t.name, sort_order: t.sort_order, is_common: t.is_common, created_at: t.created_at }
}

interface SessionFormData {
  title: string
  speaker: string
  company: string
  category: string
  planned_start_at: string
  planned_end_at: string
  total_slides: string
  rehearsal_notes: string
}

const emptyForm = (): SessionFormData => ({
  title: '', speaker: '', company: '', category: '', planned_start_at: '',
  planned_end_at: '', total_slides: '', rehearsal_notes: '',
})

function toLocalDatetime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// datetime-local input 값(타임존 정보 없음)을 브라우저 로컬 시간 기준으로 해석해 UTC ISO 문자열로 변환.
// 이 변환 없이 원본 문자열을 그대로 저장하면 Postgres가 UTC로 오인해 9시간(KST 오프셋)이 밀린다.
function toIsoOrNull(localDatetime: string): string | null {
  if (!localDatetime) return null
  return new Date(localDatetime).toISOString()
}

function sessionToForm(s: Session): SessionFormData {
  return {
    title: s.title,
    speaker: s.speaker ?? '',
    company: s.company ?? '',
    category: s.category ?? '',
    planned_start_at: toLocalDatetime(s.planned_start_at),
    planned_end_at: toLocalDatetime(s.planned_end_at),
    total_slides: s.total_slides > 0 ? String(s.total_slides) : '',
    rehearsal_notes: s.rehearsal_notes ?? '',
  }
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: '예정', ready: '대기', live: '진행 중', paused: '일시정지', ended: '완료', cancelled: '취소',
}
const STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-slate-100 text-slate-500',
  ready: 'bg-slate-100 text-slate-600',
  live: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  ended: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-slate-100 text-slate-400',
}

export default function ConsoleClient({ event, initialTracks, initialTab = 'setup' }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const { tracks, setTracks, sessions, now, connStatus } = useConsoleSync(event.id, initialTracks)
  const [activeTrackId, setActiveTrackId] = useState<string>(initialTracks[0]?.id ?? '')
  const [newTrackName, setNewTrackName] = useState('')
  const [newTrackIsCommon, setNewTrackIsCommon] = useState(false)
  const [addingTrack, setAddingTrack] = useState(false)
  const [loadingTrack, setLoadingTrack] = useState(false)

  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; trackId: string; session?: Session } | null>(null)
  const [form, setForm] = useState<SessionFormData>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const activeTrack = tracks.find((t) => t.id === activeTrackId)

  const commonTracks = tracks.filter((t) => t.is_common).map(toTrack)
  const otherTracks = tracks.filter((t) => !t.is_common).map(toTrack)
  const commonIds = new Set(commonTracks.map((t) => t.id))
  const morning = sessions.filter((s) => commonIds.has(s.track_id))
  const afternoon = sessions.filter((s) => !commonIds.has(s.track_id))
  const kpis = computeKpis(sessions, now)

  async function handleAddTrack() {
    if (!newTrackName.trim()) return
    setLoadingTrack(true)
    const res = await fetch('/api/admin/console/tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: event.id, name: newTrackName.trim(), sort_order: tracks.length, is_common: newTrackIsCommon }),
    })
    const data = await res.json()
    if (res.ok) {
      setTracks((prev) => [...prev, { ...data, sessions: [] }])
      setActiveTrackId(data.id)
      setNewTrackName('')
      setNewTrackIsCommon(false)
      setAddingTrack(false)
    }
    setLoadingTrack(false)
  }

  async function handleDeleteTrack(trackId: string) {
    if (!confirm('트랙을 삭제하면 소속 세션도 모두 삭제됩니다. 계속할까요?')) return
    const res = await fetch(`/api/admin/console/tracks/${trackId}`, { method: 'DELETE' })
    if (res.ok) {
      const next = tracks.filter((t) => t.id !== trackId)
      setTracks(next)
      if (activeTrackId === trackId) setActiveTrackId(next[0]?.id ?? '')
    }
  }

  function openAdd(trackId: string) {
    setModal({ mode: 'add', trackId })
    setForm(emptyForm())
    setFormError('')
  }

  function openEdit(trackId: string, session: Session) {
    setModal({ mode: 'edit', trackId, session })
    setForm(sessionToForm(session))
    setFormError('')
  }

  async function handleSaveSession() {
    if (!modal) return
    if (!form.title.trim()) { setFormError('세션 제목은 필수입니다.'); return }
    setSaving(true)
    setFormError('')

    const body = {
      track_id: modal.trackId,
      title: form.title.trim(),
      speaker: form.speaker.trim() || null,
      company: form.company.trim(),
      category: form.category.trim(),
      planned_start_at: toIsoOrNull(form.planned_start_at),
      planned_end_at: toIsoOrNull(form.planned_end_at),
      total_slides: form.total_slides ? parseInt(form.total_slides, 10) : 0,
      rehearsal_notes: form.rehearsal_notes.trim() || null,
    }

    const url = modal.mode === 'add'
      ? '/api/admin/console/sessions'
      : `/api/admin/console/sessions/${modal.session!.id}`
    const method = modal.mode === 'add' ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setFormError(data.error ?? '저장 실패'); setSaving(false); return }

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== modal.trackId) return t
        const sessions = modal.mode === 'add'
          ? [...t.sessions, data]
          : t.sessions.map((s) => (s.id === data.id ? data : s))
        return { ...t, sessions }
      })
    )
    setModal(null)
    setSaving(false)
  }

  async function handleDeleteSession(trackId: string, sessionId: string) {
    if (!confirm('세션을 삭제할까요?')) return
    const res = await fetch(`/api/admin/console/sessions/${sessionId}`, { method: 'DELETE' })
    if (res.ok) {
      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId ? { ...t, sessions: t.sessions.filter((s) => s.id !== sessionId) } : t
        )
      )
    }
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/console" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Monitor className="w-5 h-5 text-indigo-600" />
          <div>
            <h1 className="text-lg font-bold text-slate-800">{event.name}</h1>
            {event.event_date && (
              <p className="text-xs text-slate-400">{new Date(event.event_date).toLocaleString('ko-KR')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeStatusBadge status={connStatus} />
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('setup')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'setup' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              설정
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              현황
            </button>
          </div>
          <Link
            href={`/admin/console/${event.id}/live`}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            라이브 컨트롤러
          </Link>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          <KpiBar kpis={kpis} />
          {tracks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
              <LayoutDashboard className="w-12 h-12 opacity-30" />
              <p>트랙이 없습니다. 설정 탭에서 트랙을 추가해주세요.</p>
            </div>
          )}
          {morning.length > 0 && <MorningTimeline sessions={morning} />}
          {afternoon.length > 0 && <TrackGrid sessions={afternoon} tracks={otherTracks} />}
        </div>
      )}

      {activeTab === 'setup' && (
      <>
      {/* 트랙 탭 */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {tracks.map((track) => (
          <div key={track.id} className="flex items-center gap-1 group">
            <button
              onClick={() => setActiveTrackId(track.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTrackId === track.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
            >
              {track.name}
              <span className="ml-1.5 text-xs opacity-60">{track.sessions.length}</span>
            </button>
            <button
              onClick={() => handleDeleteTrack(track.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500"
              title="트랙 삭제"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {addingTrack ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newTrackName}
              onChange={(e) => setNewTrackName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTrack()
                if (e.key === 'Escape') setAddingTrack(false)
              }}
              placeholder="트랙 이름"
              className="border border-indigo-300 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={newTrackIsCommon}
                onChange={(e) => setNewTrackIsCommon(e.target.checked)}
              />
              오전 공통 세션
            </label>
            <button
              onClick={handleAddTrack}
              disabled={loadingTrack}
              className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
            >
              추가
            </button>
            <button onClick={() => setAddingTrack(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingTrack(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            트랙 추가
          </button>
        )}
      </div>

      {/* 세션 목록 */}
      {!activeTrack ? (
        <div className="text-center py-16 text-slate-400">
          <SlidersHorizontal className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">트랙을 먼저 추가해주세요.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-sm font-medium text-slate-700">{activeTrack.name} 세션 목록</span>
            <button
              onClick={() => openAdd(activeTrack.id)}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              <Plus className="w-4 h-4" />
              세션 추가
            </button>
          </div>

          {activeTrack.sessions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-7 h-7 mx-auto mb-2 opacity-30" />
              <p className="text-sm">세션이 없습니다. 세션을 추가해보세요.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activeTrack.sessions.map((session, idx) => (
                <li key={session.id} className="flex items-start justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-800">{session.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[session.status]}`}>
                          {STATUS_LABEL[session.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {session.speaker && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <User className="w-3 h-3" />
                            {session.speaker}
                          </span>
                        )}
                        {(session.planned_start_at || session.planned_end_at) && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            {session.planned_start_at
                              ? new Date(session.planned_start_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                              : '--'}
                            {' ~ '}
                            {session.planned_end_at
                              ? new Date(session.planned_end_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                              : '--'}
                          </span>
                        )}
                        {session.total_slides > 0 && (
                          <span className="text-xs text-slate-400">슬라이드 {session.total_slides}장</span>
                        )}
                      </div>
                      {session.rehearsal_notes && (
                        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1.5 line-clamp-2">
                          📋 {session.rehearsal_notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <button
                      onClick={() => openEdit(activeTrack.id, session)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSession(activeTrack.id, session.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 세션 추가/수정 모달 */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">
                {modal.mode === 'add' ? '세션 추가' : '세션 수정'}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">세션 제목 *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="예: 기조 연설"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">발표자</label>
                  <input
                    value={form.speaker}
                    onChange={(e) => setForm((f) => ({ ...f, speaker: e.target.value }))}
                    placeholder="예: 홍길동"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">소속</label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="예: ACME"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">카테고리</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="예: 기술"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">시작 시간</label>
                  <input
                    type="datetime-local"
                    value={form.planned_start_at}
                    onChange={(e) => setForm((f) => ({ ...f, planned_start_at: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">종료 시간</label>
                  <input
                    type="datetime-local"
                    value={form.planned_end_at}
                    onChange={(e) => setForm((f) => ({ ...f, planned_end_at: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">총 슬라이드 수</label>
                <input
                  type="number"
                  min="0"
                  value={form.total_slides}
                  onChange={(e) => setForm((f) => ({ ...f, total_slides: e.target.value }))}
                  placeholder="예: 40"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">리허설 메모</label>
                <textarea
                  rows={3}
                  value={form.rehearsal_notes}
                  onChange={(e) => setForm((f) => ({ ...f, rehearsal_notes: e.target.value }))}
                  placeholder="특이사항, 큐시트 메모 등"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>
              {formError && <p className="text-xs text-red-500">{formError}</p>}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveSession}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}
