'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Event } from '@/lib/types'

interface Template {
  id: string
  name: string
  type: 'registration' | 'reminder' | 'custom'
  is_default: boolean
  subject: string
  body_html: string
  created_at: string
  updated_at: string
}

const TYPE_LABEL: Record<string, string> = {
  registration: '등록 완료',
  reminder: '리마인드',
  custom: '커스텀',
}

const TYPE_COLOR: Record<string, string> = {
  registration: 'bg-indigo-100 text-indigo-700',
  reminder: 'bg-amber-100 text-amber-700',
  custom: 'bg-slate-100 text-slate-600',
}

const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
const LABEL = 'block text-sm font-medium mb-1'

export default function TemplatesTab({ event }: { event: Event }) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Template | null>(null)
  const [creating, setCreating] = useState(false)
  const [previewing, setPreviewing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/events/${event.id}/templates`)
    const data = await res.json()
    setTemplates(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [event.id])

  useEffect(() => { load() }, [load])

  // 기본 템플릿 자동 생성 (없는 경우)
  async function handleSeedDefaults() {
    const origin = window.location.origin
    await fetch(`/api/events/${event.id}/templates`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: event.name,
        eventDate: event.event_date ?? null,
        location: event.location ?? null,
        attendanceType: event.type === 'online' ? 'online' : 'offline',
        eventType: event.type ?? 'offline',
        slug: event.slug,
        origin,
      }),
    })
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('이 템플릿을 삭제할까요?')) return
    const res = await fetch(`/api/events/${event.id}/templates/${id}`, { method: 'DELETE' })
    if (res.status === 400) {
      const d = await res.json()
      alert(d.error)
      return
    }
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const defaultsExist = templates.some((t) => t.is_default)

  return (
    <div className="flex flex-col gap-4">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          행사 등록자에게 발송할 이메일 템플릿을 관리합니다.
        </p>
        <div className="flex gap-2">
          {!defaultsExist && (
            <button onClick={handleSeedDefaults}
              className="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              기본 템플릿 생성
            </button>
          )}
          <button onClick={() => setCreating(true)}
            className="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
            + 새 템플릿
          </button>
        </div>
      </div>

      {/* 템플릿 목록 */}
      {loading ? (
        <div className="text-sm text-slate-400 py-8 text-center">불러오는 중...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400 text-sm mb-3">아직 템플릿이 없습니다.</p>
          <button onClick={handleSeedDefaults}
            className="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
            기본 템플릿 자동 생성
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((tpl) => (
            <div key={tpl.id}
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[tpl.type]}`}>
                    {TYPE_LABEL[tpl.type]}
                  </span>
                  {tpl.is_default && (
                    <span className="text-xs text-slate-400">기본</span>
                  )}
                  <span className="font-semibold text-sm">{tpl.name}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{tpl.subject}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setPreviewing(tpl.id)}
                  className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  미리보기
                </button>
                <button onClick={() => setEditing(tpl)}
                  className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors">
                  편집
                </button>
                {!tpl.is_default && (
                  <button onClick={() => handleDelete(tpl.id)}
                    className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 편집 모달 */}
      {(editing || creating) && (
        <TemplateModal
          event={event}
          template={editing ?? undefined}
          onSave={async () => { await load(); setEditing(null); setCreating(false) }}
          onClose={() => { setEditing(null); setCreating(false) }}
        />
      )}

      {/* 미리보기 모달 */}
      {previewing && (
        <PreviewModal
          eventId={event.id}
          templateId={previewing}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  )
}

// ── 템플릿 편집/생성 모달 ─────────────────────────────────────────────────────

function TemplateModal({
  event,
  template,
  onSave,
  onClose,
}: {
  event: Event
  template?: Template
  onSave: () => Promise<void>
  onClose: () => void
}) {
  const isEdit = !!template
  const [name, setName] = useState(template?.name ?? '')
  const [type, setType] = useState<'registration' | 'reminder' | 'custom'>(
    template?.type ?? 'custom'
  )
  const [subject, setSubject] = useState(template?.subject ?? '')
  const [bodyText, setBodyText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 커스텀 템플릿 본문만 편집 가능 — 기본 템플릿은 subject만 편집
  const isCustomEditable = !template?.is_default

  useEffect(() => {
    if (template?.type === 'custom') {
      // body_html에서 텍스트 추출 (간단 처리)
      const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null
      if (parser) {
        const doc = parser.parseFromString(template.body_html, 'text/html')
        // CustomEmail의 bodyText 영역만 추출
        const el = doc.querySelector('[style*="pre-wrap"]')
        setBodyText(el?.textContent ?? '')
      }
    }
  }, [template])

  async function handleSave() {
    if (!name.trim()) { setError('템플릿 이름을 입력하세요.'); return }
    if (!subject.trim()) { setError('메일 제목을 입력하세요.'); return }
    setSaving(true)
    setError('')

    try {
      if (isEdit && template) {
        // 기본 템플릿: subject만, 커스텀: 전체 재생성
        let body_html = template.body_html
        if (type === 'custom' && isCustomEditable) {
          const { renderCustomEmail } = await import('@/lib/email')
          body_html = await renderCustomEmail({
            registrantName: '{{name}}',
            eventName: event.name,
            bodyHtml: bodyText,
          })
        }
        await fetch(`/api/events/${event.id}/templates/${template.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, subject, body_html }),
        })
      } else {
        // 새 커스텀 템플릿 생성
        const { renderCustomEmail } = await import('@/lib/email')
        const body_html = await renderCustomEmail({
          registrantName: '{{name}}',
          eventName: event.name,
          bodyHtml: bodyText,
        })
        await fetch(`/api/events/${event.id}/templates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type, subject, body_html }),
        })
      }
      await onSave()
    } catch (e) {
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="font-bold text-lg">
            {isEdit ? '템플릿 편집' : '새 템플릿'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div>
            <label className={LABEL}>템플릿 이름</label>
            <input className={INPUT} value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: VIP 초대 안내" maxLength={50} />
          </div>

          {!isEdit && (
            <div>
              <label className={LABEL}>유형</label>
              <select className={INPUT} value={type}
                onChange={(e) => setType(e.target.value as typeof type)}>
                <option value="registration">등록 완료</option>
                <option value="reminder">리마인드</option>
                <option value="custom">커스텀</option>
              </select>
            </div>
          )}

          <div>
            <label className={LABEL}>메일 제목</label>
            <input className={INPUT} value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="메일 제목을 입력하세요" maxLength={100} />
          </div>

          {/* 커스텀 템플릿만 본문 편집 가능 */}
          {(type === 'custom' || (!isEdit)) && (
            <div>
              <label className={LABEL}>본문 내용</label>
              <textarea className={`${INPUT} resize-none`} rows={8}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder={`안녕하세요.\n\n이번 행사에 여러분을 초대합니다.\n\n{{name}}님의 참석을 기다리겠습니다.`} />
              <p className="text-xs text-slate-400 mt-1">
                <code className="bg-slate-100 px-1 rounded">{'{{name}}'}</code>은 수신자 이름으로 자동 치환됩니다.
              </p>
            </div>
          )}

          {/* 기본 템플릿 편집 안내 */}
          {isEdit && template?.is_default && (
            <div className="bg-slate-50 rounded-lg px-4 py-3 text-xs text-slate-500">
              기본 템플릿은 메일 제목만 수정할 수 있습니다.<br />
              본문 레이아웃은 자동으로 행사 정보를 표시합니다.
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            취소
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors">
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 미리보기 모달 ─────────────────────────────────────────────────────────────

function PreviewModal({
  eventId,
  templateId,
  onClose,
}: {
  eventId: string
  templateId: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ height: '80vh' }}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-base">이메일 미리보기</h2>
          <button onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm px-3 py-1.5 hover:bg-slate-100 rounded-lg">
            닫기
          </button>
        </div>
        <iframe
          src={`/api/events/${eventId}/templates/${templateId}/preview`}
          className="flex-1 w-full rounded-b-2xl"
          title="이메일 미리보기"
        />
      </div>
    </div>
  )
}
