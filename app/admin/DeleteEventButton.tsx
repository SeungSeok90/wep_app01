'use client'

import { useRouter } from 'next/navigation'

export default function DeleteEventButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('이 행사를 삭제할까요?')) return
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="text-red-400 hover:text-red-600 text-xs transition-colors"
    >
      삭제
    </button>
  )
}
