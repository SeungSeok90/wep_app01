'use client'

import { useState, useEffect, useCallback } from 'react'
import type { EventField, Registration } from '@/lib/types'

type AttendanceFilter = 'all' | 'offline' | 'online'
type CheckinFilter = 'all' | 'checked' | 'unchecked'

interface Props {
  eventId: string
  fields: EventField[]
  initialRegistrations: Registration[]
  eventType: string
  offlineCapacity?: number | null
  onlineCapacity?: number | null
}

export default function RegistrationsTab({
  eventId,
  fields,
  initialRegistrations,
  eventType,
  offlineCapacity,
  onlineCapacity,
}: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>(initialRegistrations)
  const [query, setQuery] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all')
  const [checkinFilter, setCheckinFilter] = useState<CheckinFilter>('all')
  const [loading, setLoading] = useState(false)
  const [editTarget, setEditTarget] = useState<Registration | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null)

  const isHybrid = eventType === 'hybrid'
  const isOnlineOnly = eventType === 'online'
  const isOfflineOnly = eventType === 'offline'

  const fetchRegistrations = useCallback(async (
    q: string,
    attendance: AttendanceFilter,
    checkin: CheckinFilter,
  ) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (attendance !== 'all') params.set('attendance_type', attendance)
    if (checkin !== 'all') params.set('checkin', checkin)

    const res = await fetch(`/api/events/${eventId}/registrations/search?${params}`)
    const data = await res.json()
    setRegistrations(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRegistrations(query, attendanceFilter, checkinFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, attendanceFilter, checkinFilter, fetchRegistrations])

  function refresh() {
    fetchRegistrations(query, attendanceFilter, checkinFilter)
  }

  const total = registrations.length

  return (
    <div>
      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 mb-1">전체 등록</p>
          <p className="text-2xl font-bold">{initialRegistrations.length}명</p>
        </div>
        {(isHybrid || isOfflineOnly) && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 mb-1">현장 참석</p>
            <p className="text-2xl font-bold">
              {initialRegistrations.filter((r) => r.attendance_type === 'offline').length}명
            </p>
            {offlineCapacity && <p className="text-xs text-slate-400 mt-1">정원 {offlineCapacity}명</p>}
          </div>
        )}
        {(isHybrid || isOnlineOnly) && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 mb-1">온라인 참석</p>
            <p className="text-2xl font-bold">
              {initialRegistrations.filter((r) => r.attendance_type === 'online').length}명
            </p>
            {onlineCapacity && <p className="text-xs text-slate-400 mt-1">정원 {onlineCapacity}명</p>}
          </div>
        )}
      </div>

      {/* 검색 + 필터 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="이름, 이메일, 회사명 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {isHybrid && (
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {(['all', 'offline', 'online'] as AttendanceFilter[]).map((v) => (
              <button key={v} onClick={() => setAttendanceFilter(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${attendanceFilter === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {v === 'all' ? '전체' : v === 'offline' ? '현장' : '온라인'}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['all', 'checked', 'unchecked'] as CheckinFilter[]).map((v) => (
            <button key={v} onClick={() => setCheckinFilter(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${checkinFilter === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {v === 'all' ? '전체' : v === 'checked' ? '출석' : '미출석'}
            </button>
          ))}
        </div>

        <a href={`/api/events/${eventId}/registrations/export`}
          className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap self-start">
          엑셀 내보내기
        </a>
      </div>

      {(query || attendanceFilter !== 'all' || checkinFilter !== 'all') && (
        <p className="text-xs text-slate-400 mb-3">검색 결과 {total}명</p>
      )}

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {registrations.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            {query || attendanceFilter !== 'all' || checkinFilter !== 'all'
              ? <p className="text-lg">검색 결과가 없습니다.</p>
              : <p className="text-lg">아직 등록한 참가자가 없습니다.</p>
            }
          </div>
        ) : (
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-slate-100">
                <th className="px-4 py-3 text-left font-medium">등록일시</th>
                <th className="px-4 py-3 text-left font-medium">출석</th>
                {isHybrid && <th className="px-4 py-3 text-left font-medium">참석방식</th>}
                <th className="px-4 py-3 text-left font-medium">이름</th>
                <th className="px-4 py-3 text-left font-medium">이메일</th>
                <th className="px-4 py-3 text-left font-medium">연락처</th>
                <th className="px-4 py-3 text-left font-medium">회사명</th>
                <th className="px-4 py-3 text-left font-medium">부서</th>
                <th className="px-4 py-3 text-left font-medium">직급</th>
                {fields.map((f) => (
                  <th key={f.id} className="px-4 py-3 text-left font-medium">{f.label}</th>
                ))}
                <th className="px-4 py-3 text-left font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(r.registered_at).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    {r.checked_in_at ? (
                      <span className="text-xs text-emerald-600 font-medium">
                        ✅ {new Date(r.checked_in_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">미출석</span>
                    )}
                  </td>
                  {isHybrid && (
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.attendance_type === 'online' ? 'bg-violet-100 text-violet-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {r.attendance_type === 'online' ? '온라인' : '현장'}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-slate-500">{r.email}</td>
                  <td className="px-4 py-3 text-slate-500">{r.phone ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{r.company ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{r.department ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{r.position ?? '-'}</td>
                  {fields.map((f) => {
                    const answer = r.custom_answers?.[f.label]
                    return (
                      <td key={f.id} className="px-4 py-3 text-slate-500">
                        {Array.isArray(answer) ? answer.join(', ') : (answer ?? '-')}
                      </td>
                    )
                  })}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditTarget(r)}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                        수정
                      </button>
                      <button onClick={() => setDeleteTarget(r)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 수정 모달 */}
      {editTarget && (
        <EditModal
          registration={editTarget}
          fields={fields}
          isHybrid={isHybrid}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); refresh() }}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      {deleteTarget && (
        <DeleteDialog
          registration={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); refresh() }}
        />
      )}
    </div>
  )
}

/* ── 수정 모달 ── */
function EditModal({
  registration,
  fields,
  isHybrid,
  onClose,
  onSaved,
}: {
  registration: Registration
  fields: EventField[]
  isHybrid: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: registration.name,
    email: registration.email,
    phone: registration.phone ?? '',
    company: registration.company ?? '',
    department: registration.department ?? '',
    position: registration.position ?? '',
    attendance_type: registration.attendance_type,
    custom_answers: { ...(registration.custom_answers ?? {}) },
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const LABEL = 'block text-xs font-medium text-slate-500 mb-1'

  function setCustomAnswer(label: string, value: string | string[]) {
    setForm((f) => ({ ...f, custom_answers: { ...f.custom_answers, [label]: value } }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      setError('이름과 이메일은 필수입니다.')
      return
    }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/registrations/${registration.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? '저장에 실패했습니다.')
      setSaving(false)
      return
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-base">참가자 정보 수정</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        {/* 폼 */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>이름 *</label>
              <input className={INPUT} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>이메일 *</label>
              <input className={INPUT} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>연락처</label>
              <input className={INPUT} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>회사명</label>
              <input className={INPUT} value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>부서</label>
              <input className={INPUT} value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>직급</label>
              <input className={INPUT} value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} />
            </div>
          </div>

          {isHybrid && (
            <div>
              <label className={LABEL}>참석 방식</label>
              <div className="flex gap-2">
                {(['offline', 'online'] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, attendance_type: v }))}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                      form.attendance_type === v
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                        : 'border-slate-200 text-slate-500 hover:border-indigo-300'
                    }`}>
                    {v === 'offline' ? '현장' : '온라인'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {fields.length > 0 && (
            <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-400">추가 항목</p>
              {fields.map((f) => {
                const value = form.custom_answers[f.label]
                if (f.field_type === 'textarea') {
                  return (
                    <div key={f.id}>
                      <label className={LABEL}>{f.label}{f.is_required && ' *'}</label>
                      <textarea className={INPUT} rows={2}
                        value={(value as string) ?? ''}
                        onChange={(e) => setCustomAnswer(f.label, e.target.value)} />
                    </div>
                  )
                }
                if (f.field_type === 'select') {
                  return (
                    <div key={f.id}>
                      <label className={LABEL}>{f.label}{f.is_required && ' *'}</label>
                      <select className={INPUT} value={(value as string) ?? ''}
                        onChange={(e) => setCustomAnswer(f.label, e.target.value)}>
                        <option value="">선택하세요</option>
                        {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  )
                }
                if (f.field_type === 'radio') {
                  return (
                    <div key={f.id}>
                      <label className={LABEL}>{f.label}{f.is_required && ' *'}</label>
                      <div className="flex flex-wrap gap-2">
                        {f.options?.map((o) => (
                          <label key={o} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input type="radio" name={f.id} value={o} checked={value === o}
                              onChange={() => setCustomAnswer(f.label, o)} />
                            {o}
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                }
                if (f.field_type === 'checkbox') {
                  const checked = Array.isArray(value) ? value : []
                  return (
                    <div key={f.id}>
                      <label className={LABEL}>{f.label}{f.is_required && ' *'}</label>
                      <div className="flex flex-wrap gap-2">
                        {f.options?.map((o) => (
                          <label key={o} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input type="checkbox" value={o} checked={checked.includes(o)}
                              onChange={(e) => {
                                const next = e.target.checked ? [...checked, o] : checked.filter((c) => c !== o)
                                setCustomAnswer(f.label, next)
                              }} />
                            {o}
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={f.id}>
                    <label className={LABEL}>{f.label}{f.is_required && ' *'}</label>
                    <input className={INPUT} value={(value as string) ?? ''}
                      onChange={(e) => setCustomAnswer(f.label, e.target.value)} />
                  </div>
                )
              })}
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* 푸터 */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            취소
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors font-medium">
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── 삭제 확인 다이얼로그 ── */
function DeleteDialog({
  registration,
  onClose,
  onDeleted,
}: {
  registration: Registration
  onClose: () => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/registrations/${registration.id}`, { method: 'DELETE' })
    onDeleted()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="font-semibold text-base mb-2">참가자 삭제</h2>
        <p className="text-sm text-slate-500 mb-1">
          아래 참가자를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <p className="text-sm font-medium text-slate-800 mb-6">
          {registration.name} ({registration.email})
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={deleting}
            className="flex-1 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            취소
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 py-2.5 text-sm bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white rounded-lg transition-colors font-medium">
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}
