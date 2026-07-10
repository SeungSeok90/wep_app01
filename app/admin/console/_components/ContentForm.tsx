'use client'

import type { Session } from '@/lib/types'
import { NumField, SectionCard, SegGroup, TextField } from './ui'
import type { ConsoleSession } from './types'

const YES_NO = [
  { value: 'yes' as const, label: '예' },
  { value: 'no' as const, label: '아니오' },
]

export default function ContentForm({
  session,
  onPatch,
}: {
  session: ConsoleSession
  onPatch: (patch: Partial<Session>) => void
}) {
  return (
    <SectionCard title="세션 자료 정보">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <NumField label="총 장표 수" value={session.total_slides} onCommit={(v) => onPatch({ total_slides: v })} suffix="장" />
          <NumField label="현재 장표" value={session.current_slide} onCommit={(v) => onPatch({ current_slide: v })} suffix="장" />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">동영상 포함 여부</span>
          <SegGroup
            options={YES_NO}
            value={session.has_video ? 'yes' : 'no'}
            onChange={(v) => onPatch({ has_video: v === 'yes' })}
          />
        </div>

        {session.has_video && (
          <>
            <TextField
              label="동영상 페이지"
              value={session.video_pages}
              onCommit={(v) => onPatch({ video_pages: v })}
              placeholder="예: 12-18"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">동영상 오디오 유무</span>
              <SegGroup
                options={YES_NO}
                value={session.video_has_audio ? 'yes' : 'no'}
                onChange={(v) => onPatch({ video_has_audio: v === 'yes' })}
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">자료 배포 가능 여부</span>
          <SegGroup
            options={[
              { value: 'yes' as const, label: '배포 가능' },
              { value: 'no' as const, label: '배포 불가' },
            ]}
            value={session.is_distributable ? 'yes' : 'no'}
            onChange={(v) => onPatch({ is_distributable: v === 'yes' })}
            dangerValues={['no']}
          />
        </div>

        <TextField label="콘텐츠 메모" value={session.content_note} onCommit={(v) => onPatch({ content_note: v })} multiline />
      </div>
    </SectionCard>
  )
}
