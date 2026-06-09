'use client'

import { useState } from 'react'
import type { Event } from '@/lib/types'

const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
const LABEL = 'block text-sm font-medium mb-1'
const HINT = 'text-xs text-slate-400 mt-1'

export default function EmailTab({ event }: { event: Event }) {
  const [enabled, setEnabled] = useState(event.confirmation_email_enabled ?? false)
  const [subject, setSubject] = useState(event.confirmation_email_subject ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleChange() {
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        confirmation_email_enabled: enabled,
        confirmation_email_subject: subject.trim() || null,
      }),
    })
    setSaving(false)
    setSaved(true)
  }

  const defaultSubject = `[${event.name}] 등록이 완료되었습니다`

  return (
    <div className="max-w-2xl flex flex-col gap-6">

      {/* 저장 버튼 */}
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-6 py-2.5 rounded-lg transition-colors">
          {saving ? '저장 중...' : saved ? '✓ 저장됨' : '저장'}
        </button>
      </div>

      {/* 발송 토글 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-sm">등록 완료 확인 이메일</p>
            <p className="text-xs text-slate-400 mt-1">
              참가자가 등록 폼을 제출하면 자동으로 확인 이메일을 발송합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setEnabled((v) => !v); handleChange() }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              enabled ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {!enabled && (
          <div className="bg-slate-50 rounded-lg px-4 py-3 text-xs text-slate-400">
            이메일 발송이 비활성화되어 있습니다. 토글을 켜면 등록 완료 시 이메일이 자동 발송됩니다.
          </div>
        )}
      </section>

      {/* 이메일 설정 */}
      {enabled && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-5">
          <h3 className="font-semibold text-sm">이메일 설정</h3>

          <div>
            <label className={LABEL}>메일 제목</label>
            <input
              className={INPUT}
              value={subject}
              onChange={(e) => { setSubject(e.target.value); handleChange() }}
              placeholder={defaultSubject}
              maxLength={100}
            />
            <p className={HINT}>비워두면 기본값이 사용됩니다: <span className="text-slate-500">{defaultSubject}</span></p>
          </div>

          {/* 발송 내용 안내 */}
          <div>
            <p className={LABEL}>발송 내용</p>
            <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-500 space-y-1.5">
              <p>이메일에는 아래 정보가 자동으로 포함됩니다.</p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-slate-400">
                <li>참가자 이름</li>
                <li>행사명 / 행사 일시</li>
                <li>장소 (현장 참석 시)</li>
                <li>참석 방식 (현장 / 온라인)</li>
                <li>라이브 입장 링크 (온라인 / 하이브리드 행사)</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 발신 설정 안내 */}
      <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <p className="font-semibold text-sm text-amber-800 mb-2">발신 설정 안내</p>
        <ul className="text-xs text-amber-700 space-y-1.5 list-disc list-inside">
          <li><code className="bg-amber-100 px-1 rounded">RESEND_API_KEY</code> — Resend에서 발급한 API 키</li>
          <li><code className="bg-amber-100 px-1 rounded">RESEND_FROM_EMAIL</code> — 발신 이메일 주소 (도메인 인증 필요)</li>
          <li><code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_BASE_URL</code> — 서비스 도메인 (예: https://example.com)</li>
        </ul>
        <p className="text-xs text-amber-600 mt-3">
          환경 변수가 설정되지 않으면 이메일이 발송되지 않습니다.
          <a href="https://resend.com/docs" target="_blank" className="underline ml-1">Resend 문서 →</a>
        </p>
      </section>

    </div>
  )
}
