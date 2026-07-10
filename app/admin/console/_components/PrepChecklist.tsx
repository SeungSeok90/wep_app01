'use client'

import type { AvCheckStatus, ConsentStatus, RehearsalStatus, Session } from '@/lib/types'
import { NumField, SectionCard, SegGroup, TextField } from './ui'
import type { ConsoleSession } from './types'

export default function PrepChecklist({
  session,
  onPatch,
}: {
  session: ConsoleSession
  onPatch: (patch: Partial<Session>) => void
}) {
  return (
    <SectionCard title="현장 준비 체크">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-600">스피커 동의서</span>
          <SegGroup<ConsentStatus>
            options={[
              { value: 'not_received', label: '미수령' },
              { value: 'received', label: '수령완료' },
              { value: 'not_required', label: '해당없음' },
            ]}
            value={session.speaker_consent_status}
            onChange={(v) => onPatch({ speaker_consent_status: v })}
            dangerValues={['not_received']}
          />
        </div>

        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-600">리허설 상태</span>
          <SegGroup<RehearsalStatus>
            options={[
              { value: 'not_done', label: '미완료' },
              { value: 'scheduled', label: '예정' },
              { value: 'done', label: '완료' },
            ]}
            value={session.rehearsal_status}
            onChange={(v) => onPatch({ rehearsal_status: v })}
            warnValues={['not_done']}
          />
        </div>

        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-slate-600">AV 확인 상태</span>
          <SegGroup<AvCheckStatus>
            options={[
              { value: 'not_checked', label: '미확인' },
              { value: 'checked', label: '확인완료' },
              { value: 'needs_attention', label: '조치필요' },
            ]}
            value={session.av_check_status}
            onChange={(v) => onPatch({ av_check_status: v })}
            dangerValues={['needs_attention']}
            warnValues={['not_checked']}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
          <NumField label="의자" value={session.chair_count} onCommit={(v) => onPatch({ chair_count: v })} suffix="개" />
          <NumField label="핀 마이크" value={session.pin_mic_count} onCommit={(v) => onPatch({ pin_mic_count: v })} suffix="개" />
          <NumField label="핸드 마이크" value={session.hand_mic_count} onCommit={(v) => onPatch({ hand_mic_count: v })} suffix="개" />
        </div>

        <TextField label="기타 요청사항" value={session.special_requests} onCommit={(v) => onPatch({ special_requests: v })} multiline />
        <TextField label="운영 메모" value={session.operator_note} onCommit={(v) => onPatch({ operator_note: v })} multiline />
      </div>
    </SectionCard>
  )
}
