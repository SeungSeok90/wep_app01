'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'

export default function SearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    startTransition(() => {
      if (value) {
        router.push(`${pathname}?q=${encodeURIComponent(value)}`)
      } else {
        router.push(pathname)
      }
    })
  }

  return (
    <div className="relative w-72">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
      <input
        type="text"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder="행사명, 장소, 담당자 검색..."
        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {isPending && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">검색 중...</span>
      )}
    </div>
  )
}
