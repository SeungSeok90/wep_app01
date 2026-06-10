'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QrCode {
  id: string
  code: string
  name: string
  target_url: string
  description: string | null
  scan_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// 빌드 타임 env 대신 런타임 origin 사용 — 로컬/스테이징/프로덕션 모두 자동 대응
function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_BASE_URL ?? ''
}

// ── QR 이미지 컴포넌트 ────────────────────────────────────────────────────
function QrImage({ url, size = 140 }: { url: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    }).catch(() => {})
  }, [url, size])

  return <canvas ref={canvasRef} width={size} height={size} className="rounded" />
}

// ── 다운로드 함수 ─────────────────────────────────────────────────────────
async function downloadPng(url: string, name: string) {
  const dataUrl = await QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    color: { dark: '#1e293b', light: '#ffffff' },
  })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${name}-qr.png`
  a.click()
}

async function downloadSvg(url: string, name: string) {
  const svg = await QRCode.toString(url, { type: 'svg', margin: 2 })
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${name}-qr.svg`
  a.click()
  URL.revokeObjectURL(a.href)
}

// ── 폼 모달 ───────────────────────────────────────────────────────────────
function QrFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: QrCode
  onClose: () => void
  onSave: (item: QrCode) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [targetUrl, setTargetUrl] = useState(initial?.target_url ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const method = initial ? 'PUT' : 'POST'
    const endpoint = initial ? `/api/admin/qr/${initial.id}` : '/api/admin/qr'
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, target_url: targetUrl, description }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? '저장 실패'); setSaving(false); return }
    onSave(data)
    onClose()
  }

  const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{initial ? 'QR 수정' : '새 QR 만들기'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">QR 이름 *</label>
            <input className={INPUT} value={name} onChange={e => setName(e.target.value)} required placeholder="예: 행사 안내 QR" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">대상 URL *</label>
            <input className={INPUT} type="url" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} required placeholder="https://example.com" />
            <p className="text-xs text-slate-400 mt-1">QR 스캔 시 이동할 URL. 나중에 변경 가능합니다.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">메모</label>
            <textarea className={INPUT} rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="용도 메모 (선택)" />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors">취소</button>
            <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── QR 미리보기 모달 ──────────────────────────────────────────────────────
function QrPreviewModal({ item, onClose }: { item: QrCode; onClose: () => void }) {
  const qrUrl = `${getBaseUrl()}/qr/${item.code}`

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 truncate pr-4">{item.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl shrink-0">✕</button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <QrImage url={qrUrl} size={200} />
          <div className="w-full text-center">
            <p className="text-xs text-slate-400 mb-1">고정 QR URL</p>
            <p className="text-xs text-slate-600 bg-slate-50 rounded px-3 py-1.5 break-all">{qrUrl}</p>
          </div>
          <div className="w-full text-center">
            <p className="text-xs text-slate-400 mb-1">현재 연결된 URL</p>
            <p className="text-xs text-indigo-600 bg-indigo-50 rounded px-3 py-1.5 break-all">{item.target_url}</p>
          </div>
          <div className="flex gap-2 w-full">
            <button
              onClick={() => downloadPng(qrUrl, item.name)}
              className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              PNG 다운로드
            </button>
            <button
              onClick={() => downloadSvg(qrUrl, item.name)}
              className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              SVG 다운로드
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 메인 클라이언트 컴포넌트 ──────────────────────────────────────────────
export default function QrClient({ initial }: { initial: QrCode[] }) {
  const [items, setItems] = useState<QrCode[]>(initial)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<QrCode | undefined>()
  const [previewTarget, setPreviewTarget] = useState<QrCode | undefined>()
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.target_url.toLowerCase().includes(search.toLowerCase()) ||
    (item.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function handleSaved(item: QrCode) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = item; return next }
      return [item, ...prev]
    })
  }

  async function toggleActive(item: QrCode) {
    const res = await fetch(`/api/admin/qr/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !item.is_active }),
    })
    if (res.ok) handleSaved(await res.json())
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까? QR 코드를 복구할 수 없습니다.')) return
    setDeleting(id)
    await fetch(`/api/admin/qr/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
    setDeleting(null)
  }

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">QR 코드 관리</h1>
          <p className="text-sm text-slate-500 mt-0.5">총 {items.length}개</p>
        </div>
        <button
          onClick={() => { setEditTarget(undefined); setShowForm(true) }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          + 새 QR 만들기
        </button>
      </div>

      {/* 검색 */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="이름, URL, 메모로 검색..."
          className="w-full max-w-sm border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          {search ? '검색 결과가 없습니다.' : 'QR 코드가 없습니다. 첫 번째 QR을 만들어보세요.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(item => {
            const qrUrl = `${getBaseUrl()}/qr/${item.code}`
            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border transition-colors ${item.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}
              >
                <div className="p-4 flex gap-4">
                  {/* QR 이미지 */}
                  <button
                    onClick={() => setPreviewTarget(item)}
                    className="shrink-0 rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-400 transition-all"
                    title="크게 보기"
                  >
                    <QrImage url={qrUrl} size={80} />
                  </button>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900 text-sm truncate">{item.name}</p>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.is_active ? '활성' : '비활성'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate" title={item.target_url}>{item.target_url}</p>
                    {item.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{item.description}</p>}
                    <p className="text-xs text-slate-400 mt-1.5">스캔 {item.scan_count.toLocaleString()}회</p>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="px-4 pb-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => setPreviewTarget(item)}
                    className="text-xs border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    미리보기 · 다운로드
                  </button>
                  <button
                    onClick={() => { setEditTarget(item); setShowForm(true) }}
                    className="text-xs border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => toggleActive(item)}
                    className="text-xs border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {item.is_active ? '비활성화' : '활성화'}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="text-xs border border-red-100 text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deleting === item.id ? '...' : '삭제'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 모달 */}
      {showForm && (
        <QrFormModal
          initial={editTarget}
          onClose={() => setShowForm(false)}
          onSave={handleSaved}
        />
      )}
      {previewTarget && (
        <QrPreviewModal item={previewTarget} onClose={() => setPreviewTarget(undefined)} />
      )}
    </>
  )
}
