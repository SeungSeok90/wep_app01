'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [editMode, setEditMode] = useState<'basic' | 'html'>('basic')

  // 기본 설정 필드
  const [name, setName] = useState(template?.name ?? '')
  const [type, setType] = useState<'registration' | 'reminder' | 'custom'>(
    template?.type ?? 'custom'
  )
  const [subject, setSubject] = useState(template?.subject ?? '')
  const [bodyText, setBodyText] = useState('')

  // HTML 상태
  const [htmlBody, setHtmlBody] = useState(template?.body_html ?? '')
  const [htmlDirty, setHtmlDirty] = useState(false) // 사용자가 HTML 직접 수정 여부
  const [syncing, setSyncing] = useState(false)     // 기본 설정 → HTML 렌더링 중

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 초기 bodyText 추출 (커스텀 타입)
  useEffect(() => {
    if (template?.type === 'custom') {
      const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null
      if (parser) {
        const doc = parser.parseFromString(template.body_html, 'text/html')
        const el = doc.querySelector('[style*="pre-wrap"]')
        setBodyText(el?.textContent ?? '')
      }
    }
  }, [template])

  // 기본 설정 변경 시 HTML 자동 렌더링 (debounce 800ms, htmlDirty가 false일 때만)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleSync(overrideType?: string, overrideSubject?: string, overrideBody?: string) {
    if (htmlDirty) return
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      renderToHtml(overrideType ?? type, overrideSubject ?? subject, overrideBody ?? bodyText)
    }, 800)
  }

  async function renderToHtml(t: string, s: string, b: string) {
    setSyncing(true)
    try {
      const origin = window.location.origin
      const liveUrl = event.slug ? `${origin}/${event.slug}/live` : undefined
      const res = await fetch('/api/render-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: t,
          eventName: event.name,
          eventDate: event.event_date ?? null,
          location: event.location ?? null,
          attendanceType: event.type === 'online' ? 'online' : 'offline',
          eventType: event.type ?? 'offline',
          liveUrl,
          bodyHtml: b,
          subject: s,
        }),
      })
      const data = await res.json()
      if (data.html) setHtmlBody(data.html)
    } finally {
      setSyncing(false)
    }
  }

  // 초기 렌더링 (새 템플릿 생성 시)
  useEffect(() => {
    if (!isEdit) {
      renderToHtml(type, subject, bodyText)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current) }
  }, [])

  async function handleSave() {
    if (!name.trim()) { setError('템플릿 이름을 입력하세요.'); return }
    if (!subject.trim()) { setError('메일 제목을 입력하세요.'); return }
    if (!htmlBody.trim()) { setError('HTML 내용이 없습니다.'); return }
    setSaving(true)
    setError('')

    try {
      if (isEdit && template) {
        await fetch(`/api/events/${event.id}/templates/${template.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, subject, body_html: htmlBody }),
        })
      } else {
        await fetch(`/api/events/${event.id}/templates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type, subject, body_html: htmlBody }),
        })
      }
      await onSave()
    } catch {
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col"
        style={{ height: '90vh' }}>

        {/* 헤더 */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <h2 className="font-bold text-lg">{isEdit ? '템플릿 편집' : '새 템플릿'}</h2>
          <div className="flex items-center gap-3">
            {/* 동기화 상태 */}
            {syncing && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                HTML 생성 중
              </span>
            )}
            {!syncing && !htmlDirty && htmlBody && (
              <span className="text-xs text-green-600">● 동기화됨</span>
            )}
            {htmlDirty && (
              <button onClick={() => { setHtmlDirty(false); renderToHtml(type, subject, bodyText) }}
                className="text-xs text-amber-600 hover:text-amber-700 underline">
                기본 설정으로 초기화
              </button>
            )}
            {/* 편집 모드 탭 */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              <button onClick={() => setEditMode('basic')}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  editMode === 'basic' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                기본 설정
              </button>
              <button onClick={() => setEditMode('html')}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  editMode === 'html' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                HTML + 미리보기
              </button>
            </div>
          </div>
        </div>

        {/* 바디 */}
        <div className="flex-1 overflow-hidden flex">

          {/* ── 기본 설정 탭 ── */}
          {editMode === 'basic' && (
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
                    onChange={(e) => {
                      const v = e.target.value as typeof type
                      setType(v)
                      scheduleSync(v, subject, bodyText)
                    }}>
                    <option value="registration">등록 완료</option>
                    <option value="reminder">리마인드</option>
                    <option value="custom">커스텀</option>
                  </select>
                </div>
              )}

              <div>
                <label className={LABEL}>메일 제목</label>
                <input className={INPUT} value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value)
                    scheduleSync(type, e.target.value, bodyText)
                  }}
                  placeholder="메일 제목을 입력하세요" maxLength={100} />
              </div>

              {/* 커스텀 타입만 본문 텍스트 편집 */}
              {(type === 'custom' || !isEdit) && (
                <div>
                  <label className={LABEL}>본문 내용</label>
                  <textarea className={`${INPUT} resize-none`} rows={10}
                    value={bodyText}
                    onChange={(e) => {
                      setBodyText(e.target.value)
                      scheduleSync(type, subject, e.target.value)
                    }}
                    placeholder={`안녕하세요.\n\n이번 행사에 여러분을 초대합니다.\n\n{{name}}님의 참석을 기다리겠습니다.`} />
                  <p className="text-xs text-slate-400 mt-1">
                    <code className="bg-slate-100 px-1 rounded">{'{{name}}'}</code>은 수신자 이름으로 자동 치환됩니다.
                  </p>
                </div>
              )}

              {/* 기본 템플릿 안내 */}
              {isEdit && template?.is_default && template?.type !== 'custom' && (
                <div className="bg-slate-50 rounded-lg px-4 py-3 text-xs text-slate-500">
                  기본 템플릿은 행사 정보를 자동으로 표시합니다.<br />
                  레이아웃을 수정하려면 <strong>HTML + 미리보기</strong> 탭을 사용하세요.
                </div>
              )}

              <button onClick={() => setEditMode('html')}
                className="self-start text-xs text-indigo-600 hover:text-indigo-700 underline mt-1">
                HTML 편집 탭에서 미리보기 →
              </button>
            </div>
          )}

          {/* ── HTML + 미리보기 탭 ── */}
          {editMode === 'html' && (
            <div className="flex-1 flex overflow-hidden">
              {/* 에디터 */}
              <div className="w-1/2 flex flex-col border-r border-slate-100">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800">
                  <span className="text-xs text-slate-400 font-mono">HTML 소스</span>
                  <span className="text-xs text-slate-500">{htmlBody.length.toLocaleString()}자</span>
                </div>
                <textarea
                  className="flex-1 w-full px-4 py-3 text-xs font-mono bg-slate-950 text-green-400 focus:outline-none resize-none"
                  value={htmlBody}
                  onChange={(e) => {
                    setHtmlBody(e.target.value)
                    setHtmlDirty(true)
                  }}
                  placeholder="<!DOCTYPE html>..."
                  spellCheck={false}
                />
                <div className="px-4 py-2 bg-slate-900 border-t border-slate-800">
                  <p className="text-xs text-slate-500">
                    <code className="text-green-500">{'{{name}}'}</code>은 발송 시 수신자 이름으로 자동 치환됩니다.
                  </p>
                </div>
              </div>

              {/* 미리보기 */}
              <div className="w-1/2 flex flex-col bg-slate-100">
                <div className="flex items-center px-4 py-2 bg-slate-200 border-b border-slate-300">
                  <span className="text-xs text-slate-500 font-medium">실시간 미리보기</span>
                </div>
                <iframe
                  className="flex-1 w-full"
                  srcDoc={htmlBody || '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;color:#94a3b8;font-family:sans-serif;font-size:14px">HTML을 입력하면 여기서 미리볼 수 있습니다.</body></html>'}
                  title="이메일 미리보기"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            취소
          </button>
          <button onClick={handleSave} disabled={saving || syncing}
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
