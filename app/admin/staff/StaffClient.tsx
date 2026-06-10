'use client'

import { useState } from 'react'

interface StaffMember {
  id: string
  email: string
  name: string | null
  created_at: string
  event_staff: { event_id: string }[]
}

interface EventItem {
  id: string
  name: string
}

interface Props {
  initialStaff: StaffMember[]
  events: EventItem[]
}

const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
const LABEL = 'block text-sm font-medium text-slate-700 mb-1'

export default function StaffClient({ initialStaff, events }: Props) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [assignTarget, setAssignTarget] = useState<StaffMember | null>(null)

  async function fetchStaff() {
    const res = await fetch('/api/admin/staff')
    const data = await res.json()
    setStaff(Array.isArray(data) ? data : [])
  }

  function getAssignedEvents(member: StaffMember) {
    return events.filter((e) => member.event_staff.some((es) => es.event_id === e.id))
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          + 담당자 추가
        </button>
      </div>

      {/* 담당자 목록 */}
      {staff.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          등록된 담당자가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {staff.map((member) => {
            const assigned = getAssignedEvents(member)
            return (
              <div key={member.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{member.name ?? '(이름 없음)'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{member.email}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {assigned.length === 0 ? (
                        <span className="text-xs text-slate-300">배정된 행사 없음</span>
                      ) : (
                        assigned.map((e) => (
                          <span key={e.id} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                            {e.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setAssignTarget(member)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                      행사 배정
                    </button>
                    <DeleteStaffButton id={member.id} onDeleted={fetchStaff} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateStaffModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchStaff() }}
        />
      )}

      {assignTarget && (
        <AssignEventModal
          staff={assignTarget}
          events={events}
          onClose={() => setAssignTarget(null)}
          onUpdated={() => { setAssignTarget(null); fetchStaff() }}
        />
      )}
    </div>
  )
}

/* ── 담당자 생성 모달 ── */
function CreateStaffModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const LABEL = 'block text-sm font-medium text-slate-700 mb-1'

  async function handleCreate() {
    if (!form.email || !form.password) { setError('이메일과 비밀번호는 필수입니다.'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? '생성에 실패했습니다.')
      setSaving(false); return
    }
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-base">담당자 추가</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className={LABEL}>이름</label>
            <input className={INPUT} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="홍길동" />
          </div>
          <div>
            <label className={LABEL}>이메일 *</label>
            <input className={INPUT} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="staff@example.com" />
          </div>
          <div>
            <label className={LABEL}>초기 비밀번호 *</label>
            <input className={INPUT} type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="8자 이상" />
            <p className="text-xs text-slate-400 mt-1">담당자가 로그인 후 변경할 수 있습니다.</p>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">취소</button>
          <button onClick={handleCreate} disabled={saving}
            className="flex-1 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors font-medium">
            {saving ? '생성 중...' : '생성'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── 행사 배정 모달 ── */
function AssignEventModal({
  staff, events, onClose, onUpdated,
}: {
  staff: StaffMember
  events: EventItem[]
  onClose: () => void
  onUpdated: () => void
}) {
  const assignedIds = new Set(staff.event_staff.map((es) => es.event_id))
  const [loading, setLoading] = useState<string | null>(null)

  async function toggle(eventId: string) {
    setLoading(eventId)
    const isAssigned = assignedIds.has(eventId)
    await fetch('/api/admin/event-staff', {
      method: isAssigned ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, user_id: staff.id }),
    })
    onUpdated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-base">행사 배정</h2>
            <p className="text-xs text-slate-400 mt-0.5">{staff.name ?? staff.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <div className="overflow-y-auto px-6 py-4 flex flex-col gap-2">
          {events.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">등록된 행사가 없습니다.</p>}
          {events.map((e) => {
            const assigned = assignedIds.has(e.id)
            return (
              <button key={e.id} onClick={() => toggle(e.id)} disabled={loading === e.id}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors ${
                  assigned
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-slate-50'
                }`}>
                <span>{e.name}</span>
                <span className={`text-xs font-medium ${assigned ? 'text-indigo-500' : 'text-slate-300'}`}>
                  {loading === e.id ? '...' : assigned ? '배정됨 ✓' : '배정 안됨'}
                </span>
              </button>
            )
          })}
        </div>
        <div className="px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-2.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">닫기</button>
        </div>
      </div>
    </div>
  )
}

/* ── 담당자 삭제 버튼 ── */
function DeleteStaffButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
    onDeleted()
  }

  if (confirm) {
    return (
      <div className="flex gap-1">
        <button onClick={handleDelete} disabled={deleting}
          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50">
          {deleting ? '삭제 중...' : '확인'}
        </button>
        <button onClick={() => setConfirm(false)} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">취소</button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirm(true)} className="text-xs text-red-400 hover:text-red-600 transition-colors">삭제</button>
  )
}
