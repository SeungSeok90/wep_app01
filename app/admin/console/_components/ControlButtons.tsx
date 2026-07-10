'use client'

import { useState } from 'react'
import type { Session } from '@/lib/types'
import { BigButton, SectionCard } from './ui'
import type { ConsoleSession } from './types'

export default function ControlButtons({
  session,
  onPatch,
}: {
  session: ConsoleSession
  onPatch: (patch: Partial<Session>) => void
}) {
  const [issueDraft, setIssueDraft] = useState('')
  const [slideDraft, setSlideDraft] = useState(String(session.current_slide))

  const started = !!session.started_at
  const ended = !!session.completed_at
  const isPaused = session.status === 'paused'
  const hasIssue = !!session.issue_note
  const maxSlide = session.total_slides || 9999

  const setSlide = (next: number) => {
    const clamped = Math.max(0, Math.min(maxSlide, next))
    onPatch({ current_slide: clamped })
    setSlideDraft(String(clamped))
  }

  return (
    <SectionCard title="진행 제어">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <BigButton
            tone="primary"
            disabled={started}
            onClick={() => onPatch({ status: 'live', started_at: new Date().toISOString() })}
          >
            세션 시작
          </BigButton>
          <BigButton
            tone="default"
            disabled={!started || ended}
            onClick={() => onPatch({ status: 'ended', completed_at: new Date().toISOString() })}
          >
            세션 종료
          </BigButton>
          <BigButton
            tone={isPaused ? 'warn' : 'ghost'}
            disabled={!started || ended}
            onClick={() => onPatch({ status: isPaused ? 'live' : 'paused' })}
          >
            {isPaused ? '재개' : '일시정지'}
          </BigButton>
          <BigButton
            tone={hasIssue ? 'danger' : 'ghost'}
            disabled={!hasIssue && !issueDraft.trim()}
            onClick={() => {
              if (hasIssue) {
                onPatch({ issue_note: null })
              } else {
                onPatch({ issue_note: issueDraft.trim() })
                setIssueDraft('')
              }
            }}
          >
            {hasIssue ? '이슈 해제' : '이슈 등록'}
          </BigButton>
        </div>

        {!hasIssue && (
          <div className="flex gap-2">
            <input
              value={issueDraft}
              onChange={(e) => setIssueDraft(e.target.value)}
              placeholder="이슈 내용 입력 후 등록 (예: 마이크 음량 저하)"
              className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            />
            <BigButton
              tone="danger"
              className="px-4 py-1.5"
              disabled={!issueDraft.trim()}
              onClick={() => {
                onPatch({ issue_note: issueDraft.trim() })
                setIssueDraft('')
              }}
            >
              이슈 등록
            </BigButton>
          </div>
        )}
        {hasIssue && <p className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">현재 이슈: {session.issue_note}</p>}

        <div className="border-t border-slate-100 pt-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">장표 진행</p>
          <div className="flex items-center gap-3">
            <BigButton tone="ghost" className="h-16 flex-1 text-2xl" onClick={() => setSlide(session.current_slide - 1)}>
              − 1
            </BigButton>
            <input
              type="number"
              value={slideDraft}
              onChange={(e) => setSlideDraft(e.target.value)}
              onBlur={() => {
                const v = Number(slideDraft)
                if (!Number.isNaN(v)) setSlide(v)
              }}
              className="w-24 rounded-lg border-2 border-slate-300 px-2 py-3 text-center text-2xl font-extrabold tabular-nums"
            />
            <BigButton tone="primary" className="h-16 flex-1 text-2xl" onClick={() => setSlide(session.current_slide + 1)}>
              + 1
            </BigButton>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
