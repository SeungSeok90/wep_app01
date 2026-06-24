'use client'

import { AlertTriangle } from 'lucide-react'

interface Props {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'primary',
  onConfirm,
  onCancel,
}: Props) {
  const confirmStyle =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-500 text-white'
      : 'bg-green-600 hover:bg-green-500 text-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${variant === 'danger' ? 'text-red-400' : 'text-green-400'}`} />
          <div>
            <h3 className="font-semibold text-white text-base">{title}</h3>
            {description && (
              <p className="text-sm text-slate-400 mt-1">{description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${confirmStyle}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
