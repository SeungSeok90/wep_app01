'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

interface Props {
  role: 'super' | 'staff'
  adminName: string
}

export default function AdminSidebar({ role, adminName }: Props) {
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const navItems = [
    { href: '/admin', label: '개요 / 행사 관리', exact: true },
    ...(role === 'super' ? [{ href: '/admin/staff', label: '담당자 관리', exact: false }] : []),
  ]

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const roleLabel = role === 'super' ? '슈퍼 관리자' : '담당자'
  const roleBg = role === 'super' ? 'bg-indigo-600' : 'bg-slate-600'

  const NavContent = () => (
    <>
      <div className="px-6 py-5 border-b border-slate-700">
        <span className="font-bold text-lg">등록 플랫폼</span>
        <span className={`ml-2 text-xs ${roleBg} px-2 py-0.5 rounded-full`}>{roleLabel}</span>
      </div>

      <nav className="flex flex-col gap-1 p-4 flex-1">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={`px-4 py-2.5 rounded-lg text-sm transition-colors ${
                active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 flex flex-col gap-3">
        <div className="px-2">
          <p className="text-xs text-slate-500">로그인 계정</p>
          <p className="text-sm text-slate-300 mt-0.5 truncate">{adminName}</p>
        </div>
        <button onClick={handleLogout} disabled={loggingOut}
          className="w-full text-left px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50">
          {loggingOut ? '로그아웃 중...' : '로그아웃'}
        </button>
        <a href="/" className="text-slate-400 hover:text-white text-sm transition-colors px-4">← 홈으로</a>
      </div>
    </>
  )

  return (
    <>
      {/* 모바일 상단 바 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between h-14">
        <span className="font-bold">등록 플랫폼 <span className={`text-xs ${roleBg} px-2 py-0.5 rounded-full ml-1`}>{roleLabel}</span></span>
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
          <span className="text-xl">☰</span>
        </button>
      </div>

      {/* 모바일 오버레이 */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setOpen(false)}>
          <div className="w-64 h-full bg-slate-900 text-white flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
              <span className="font-bold text-lg">등록 플랫폼</span>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <NavContent />
          </div>
        </div>
      )}

      {/* 데스크탑 사이드바 */}
      <aside className="hidden lg:flex w-56 min-h-screen bg-slate-900 text-white flex-col fixed top-0 left-0 bottom-0 z-30">
        <NavContent />
      </aside>
    </>
  )
}
