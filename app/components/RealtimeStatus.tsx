'use client'

import { Wifi, WifiOff, Loader2 } from 'lucide-react'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export function RealtimeStatusBadge({ status }: { status: ConnectionStatus }) {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-400">
        <Wifi className="w-3.5 h-3.5" />
        <span>실시간 연결됨</span>
      </div>
    )
  }
  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-yellow-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>연결 중...</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 text-xs text-red-400">
      <WifiOff className="w-3.5 h-3.5" />
      <span>연결 끊김 — 새로고침 필요</span>
    </div>
  )
}

export function DisconnectedBanner({ status }: { status: ConnectionStatus }) {
  if (status !== 'disconnected') return null
  return (
    <div className="bg-red-900/80 border-b border-red-700 px-6 py-2 flex items-center gap-2 text-sm text-red-200">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>실시간 연결이 끊겼습니다. 데이터가 최신 상태가 아닐 수 있습니다.</span>
      <button
        onClick={() => window.location.reload()}
        className="ml-auto underline hover:text-white transition-colors"
      >
        새로고침
      </button>
    </div>
  )
}
