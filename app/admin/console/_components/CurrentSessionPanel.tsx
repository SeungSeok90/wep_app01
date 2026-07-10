'use client'

import { useState } from 'react'
import type { Session, Track } from '@/lib/types'
import { formatTime } from '@/lib/session-logic'
import StatusBadge from './StatusBadge'
import { BigButton } from './ui'
import type { ConsoleSession } from './types'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  )
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function allocatedMinutes(s: ConsoleSession): number | null {
  if (!s.planned_start_at || !s.planned_end_at) return null
  return Math.round((new Date(s.planned_end_at).getTime() - new Date(s.planned_start_at).getTime()) / 60000)
}

export default function CurrentSessionPanel({
  session,
  tracks,
  onPatch,
  onDelete,
}: {
  session: ConsoleSession
  tracks: Track[]
  onPatch: (patch: Partial<Session>) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => makeDraft(session))

  function makeDraft(s: ConsoleSession) {
    return {
      title: s.title,
      speaker: s.speaker ?? '',
      company: s.company,
      track_id: s.track_id,
      category: s.category,
      planned_start_at: toLocalInputValue(s.planned_start_at),
      planned_end_at: toLocalInputValue(s.planned_end_at),
    }
  }

  const startEdit = () => {
    setDraft(makeDraft(session))
    setEditing(true)
  }

  const save = () => {
    const startIso = draft.planned_start_at ? new Date(draft.planned_start_at).toISOString() : null
    const endIso = draft.planned_end_at ? new Date(draft.planned_end_at).toISOString() : null
    if (startIso && endIso && new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      alert('종료 시간은 시작 시간보다 늦어야 합니다.')
      return
    }
    onPatch({
      title: draft.title,
      speaker: draft.speaker || null,
      company: draft.company,
      track_id: draft.track_id,
      category: draft.category,
      planned_start_at: startIso,
      planned_end_at: endIso,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-blue-300 bg-blue-50/40 p-4 shadow-sm">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-blue-600">세션 기본 정보 수정</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-slate-600">세션명</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">발표자</span>
            <input
              value={draft.speaker}
              onChange={(e) => setDraft({ ...draft, speaker: e.target.value })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">소속</span>
            <input
              value={draft.company}
              onChange={(e) => setDraft({ ...draft, company: e.target.value })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">트랙</span>
            <select
              value={draft.track_id}
              onChange={(e) => setDraft({ ...draft, track_id: e.target.value })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">카테고리</span>
            <input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">예정 시작</span>
            <input
              type="datetime-local"
              value={draft.planned_start_at}
              onChange={(e) => setDraft({ ...draft, planned_start_at: e.target.value })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">예정 종료</span>
            <input
              type="datetime-local"
              value={draft.planned_end_at}
              onChange={(e) => setDraft({ ...draft, planned_end_at: e.target.value })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <BigButton tone="primary" onClick={save}>저장</BigButton>
          <BigButton tone="ghost" onClick={() => setEditing(false)}>취소</BigButton>
        </div>
      </div>
    )
  }

  const allocated = allocatedMinutes(session)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-blue-600">{session.track_name}</p>
          <h2 className="break-words text-lg font-bold leading-snug text-slate-900">{session.title}</h2>
          <p className="text-sm text-slate-500">{session.speaker} · {session.company}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={session.timing.effective_status} />
          <button
            onClick={startEdit}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            수정
          </button>
          <button
            onClick={() => {
              if (confirm(`"${session.title}" 세션을 삭제할까요? 되돌릴 수 없습니다.`)) onDelete()
            }}
            className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-slate-100 pt-3 sm:grid-cols-3">
        <Field label="예정 시작" value={session.planned_start_at ? formatTime(session.planned_start_at) : '-'} />
        <Field label="예정 종료" value={session.planned_end_at ? formatTime(session.planned_end_at) : '-'} />
        <Field label="할당 시간" value={allocated !== null ? `${allocated}분` : '-'} />
        <Field label="실제 시작" value={session.started_at ? formatTime(session.started_at) : '-'} />
        <Field label="실제 종료" value={session.completed_at ? formatTime(session.completed_at) : '-'} />
      </div>
    </div>
  )
}
