'use client'

import { useState, useCallback, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const ICONS = {
  success: <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />,
  error:   <XCircle     className="w-4 h-4 text-red-400   shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />,
}

const STYLES = {
  success: 'bg-slate-800 border-green-600',
  error:   'bg-slate-800 border-red-600',
  warning: 'bg-slate-800 border-yellow-500',
}

let uid = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, type: ToastType = 'error') => {
    const id = ++uid
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, show, dismiss }
}

export function ToastContainer({
  toasts,
  dismiss,
}: {
  toasts: ReturnType<typeof useToast>['toasts']
  dismiss: (id: number) => void
}) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-white text-sm max-w-sm pointer-events-auto animate-in slide-in-from-bottom-2 duration-200 ${STYLES[t.type]}`}
        >
          {ICONS[t.type]}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-white ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
