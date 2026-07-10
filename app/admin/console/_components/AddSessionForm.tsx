'use client'

import { useState } from 'react'
import type { Session, Track } from '@/lib/types'
import { SectionCard, BigButton } from './ui'

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultDraft(tracks: Track[]) {
  const start = new Date()
  start.setMinutes(Math.ceil(start.getMinutes() / 5) * 5, 0, 0)
  const end = new Date(start.getTime() + 30 * 60000)
  return {
    title: '',
    speaker: '',
    company: '',
    track_id: tracks[0]?.id ?? '',
    category: '',
    total_slides: '0',
    planned_start_at: toLocalInputValue(start),
    planned_end_at: toLocalInputValue(end),
  }
}

export default function AddSessionForm({ tracks, onCreated }: { tracks: Track[]; onCreated: (session: Session) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(() => defaultDraft(tracks))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!open) {
    return (
      <BigButton tone="ghost" className="w-full" onClick={() => { setDraft(defaultDraft(tracks)); setOpen(true) }}>
        + 세션 추가
      </BigButton>
    )
  }

  const submit = async () => {
    if (!draft.title.trim()) { setError('세션명을 입력하세요.'); return }
    if (!draft.track_id) { setError('트랙을 먼저 추가하세요.'); return }
    const startIso = draft.planned_start_at ? new Date(draft.planned_start_at).toISOString() : null
    const endIso = draft.planned_end_at ? new Date(draft.planned_end_at).toISOString() : null
    if (startIso && endIso && new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setError('종료 시간은 시작 시간보다 늦어야 합니다.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/console/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_id: draft.track_id,
          title: draft.title.trim(),
          speaker: draft.speaker.trim(),
          company: draft.company.trim(),
          category: draft.category.trim(),
          total_slides: Math.max(0, Number(draft.total_slides) || 0),
          planned_start_at: startIso,
          planned_end_at: endIso,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '추가에 실패했습니다.')
      setOpen(false)
      onCreated(data as Session)
    } catch (e) {
      setError(e instanceof Error ? e.message : '추가에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SectionCard title="세션 추가">
      <div className="flex flex-col gap-2.5">
        {error && <p className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600">{error}</p>}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">세션명 *</span>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
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
        </div>
        <div className="grid grid-cols-2 gap-2">
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
        </div>
        <div className="grid grid-cols-2 gap-2">
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
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">총 장표 수</span>
          <input
            type="number"
            min={0}
            value={draft.total_slides}
            onChange={(e) => setDraft({ ...draft, total_slides: e.target.value })}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <div className="flex gap-2 pt-1">
          <BigButton tone="primary" className="flex-1" onClick={submit} disabled={submitting}>추가</BigButton>
          <BigButton tone="ghost" className="flex-1" onClick={() => setOpen(false)}>취소</BigButton>
        </div>
      </div>
    </SectionCard>
  )
}
