'use client'

import { useState } from 'react'
import type { Event } from '@/lib/types'

const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
const LABEL = 'block text-sm font-medium mb-1'
const HINT = 'text-xs text-slate-400 mt-1'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
      {hint && <p className={HINT}>{hint}</p>}
    </div>
  )
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{text}</span>
  )
}

export default function MetaTab({ event }: { event: Event }) {
  const [form, setForm] = useState({
    meta_title: event.meta_title ?? '',
    meta_description: event.meta_description ?? '',
    favicon_url: event.favicon_url ?? '',
    og_title: event.og_title ?? '',
    og_description: event.og_description ?? '',
    og_image_url: event.og_image_url ?? '',
    theme_color: event.theme_color ?? '#6366f1',
    is_indexable: event.is_indexable ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
  }

  // 미리보기: 빈 값이면 행사명으로 대체
  const previewTitle = form.meta_title || event.name
  const previewOgTitle = form.og_title || previewTitle
  const previewOgDesc = form.og_description || form.meta_description || `${event.name} 참가 신청`

  return (
    <div className="max-w-2xl flex flex-col gap-6">

      {/* 저장 버튼 */}
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-6 py-2.5 rounded-lg transition-colors">
          {saving ? '저장 중...' : saved ? '✓ 저장됨' : '저장'}
        </button>
        <a href={`/${event.slug}`} target="_blank"
          className="text-sm text-indigo-500 hover:underline px-2 py-2.5">
          등록 페이지 확인 →
        </a>
      </div>

      {/* 기본 메타 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
        <h3 className="font-semibold text-sm">기본 메타 태그</h3>

        <Field label="페이지 제목 (title)" hint="브라우저 탭에 표시됩니다. 비워두면 행사명이 사용됩니다.">
          <input className={INPUT} value={form.meta_title}
            onChange={(e) => set('meta_title', e.target.value)}
            placeholder={event.name} maxLength={60} />
          <p className={HINT}>{form.meta_title.length}/60자 권장</p>
        </Field>

        <Field label="페이지 설명 (description)" hint="검색 결과와 링크 공유 시 설명 텍스트로 사용됩니다.">
          <textarea className={INPUT} rows={2} value={form.meta_description}
            onChange={(e) => set('meta_description', e.target.value)}
            placeholder="행사 설명을 입력하세요" maxLength={160} />
          <p className={HINT}>{form.meta_description.length}/160자 권장</p>
        </Field>

        <Field label="파비콘 URL" hint="브라우저 탭에 표시되는 아이콘입니다. 권장 사이즈: 32×32px 또는 64×64px (ICO, PNG, SVG)">
          <input className={INPUT} value={form.favicon_url}
            onChange={(e) => set('favicon_url', e.target.value)}
            placeholder="https://example.com/favicon.ico" />
        </Field>
      </section>

      {/* OG 태그 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">OG 태그 (SNS / 메신저 공유)</h3>
          <div className="flex gap-1">
            {['카카오톡', '슬랙', '라인', '페이스북'].map((p) => (
              <Badge key={p} text={p} color="bg-slate-100 text-slate-500" />
            ))}
          </div>
        </div>

        <Field label="공유 제목 (og:title)" hint="비워두면 페이지 제목이 사용됩니다.">
          <input className={INPUT} value={form.og_title}
            onChange={(e) => set('og_title', e.target.value)}
            placeholder={previewTitle} maxLength={60} />
        </Field>

        <Field label="공유 설명 (og:description)" hint="비워두면 페이지 설명이 사용됩니다.">
          <textarea className={INPUT} rows={2} value={form.og_description}
            onChange={(e) => set('og_description', e.target.value)}
            placeholder={form.meta_description || '행사 설명'} maxLength={200} />
        </Field>

        <Field
          label="공유 이미지 URL (og:image)"
          hint="권장 사이즈: 1200×630px (최소 600×315px) · JPG, PNG 권장 · 파일 크기 8MB 이하"
        >
          <input className={INPUT} value={form.og_image_url}
            onChange={(e) => set('og_image_url', e.target.value)}
            placeholder="https://example.com/event-banner.jpg" />
          {form.og_image_url && (
            <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 w-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.og_image_url} alt="OG 이미지 미리보기"
                className="w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          )}
        </Field>

        {/* 카카오톡 공유 미리보기 */}
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium">카카오톡 공유 미리보기</p>
          <div className="bg-[#FAE100] rounded-xl p-3 max-w-xs">
            {form.og_image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={form.og_image_url} alt="" className="w-full aspect-video object-cover rounded-lg mb-2"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <div className="w-full aspect-video bg-slate-200 rounded-lg mb-2 flex items-center justify-center">
                <span className="text-xs text-slate-400">이미지 없음</span>
              </div>
            )}
            <p className="text-xs font-bold text-slate-900 leading-tight">{previewOgTitle}</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-tight line-clamp-2">{previewOgDesc}</p>
            <p className="text-xs text-slate-400 mt-1">{event.slug ? `도메인/${event.slug}` : '도메인/slug'}</p>
          </div>
        </div>
      </section>

      {/* 추가 설정 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
        <h3 className="font-semibold text-sm">추가 설정</h3>

        <Field label="테마 컬러" hint="모바일 브라우저 상단 주소창 색상입니다.">
          <div className="flex items-center gap-3">
            <input type="color" value={form.theme_color}
              onChange={(e) => set('theme_color', e.target.value)}
              className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
            <input className={`${INPUT} w-32`} value={form.theme_color}
              onChange={(e) => set('theme_color', e.target.value)}
              placeholder="#6366f1" maxLength={7} />
            <span className="text-xs text-slate-400">예: #6366f1</span>
          </div>
        </Field>

        <div>
          <label className={LABEL}>검색 엔진 노출</label>
          <div className="flex gap-3">
            {[
              { value: true,  label: '노출 허용', desc: '검색 엔진에 페이지 등록 허용' },
              { value: false, label: '노출 차단', desc: '검색 엔진에서 제외 (비공개 행사)' },
            ].map((opt) => (
              <button key={String(opt.value)} type="button"
                onClick={() => set('is_indexable', opt.value)}
                className={`flex-1 py-2.5 px-3 text-left rounded-lg border text-sm transition-colors ${
                  form.is_indexable === opt.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:border-indigo-300'
                }`}
              >
                <p className="font-medium text-xs">{opt.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
