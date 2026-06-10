'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

interface Props {
  role: 'super' | 'staff'
  adminName: string
  collapsed: boolean
  onToggle: () => void
}

// ── 인라인 SVG 아이콘 ──────────────────────────────────────────────────────
function IconDashboard() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
function IconUsers() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function IconLogout() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
function IconHome() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
function IconBarChart() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}
function IconChevronLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
function IconChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
function IconMenu() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

export default function AdminSidebar({ role, adminName, collapsed, onToggle }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const navItems = [
    { href: '/admin', label: '개요 / 행사 관리', exact: true, icon: <IconDashboard /> },
    { href: '/admin/stats', label: '통계', exact: false, icon: <IconBarChart /> },
    ...(role === 'super' ? [{ href: '/admin/staff', label: '담당자 관리', exact: false, icon: <IconUsers /> }] : []),
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

  return (
    <>
      {/* ── 모바일 상단 바 ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between h-14">
        <span className="font-bold">
          등록 플랫폼
          <span className={`text-xs ${roleBg} px-2 py-0.5 rounded-full ml-2`}>{roleLabel}</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50 px-2 py-1"
          >
            {loggingOut ? '...' : '로그아웃'}
          </button>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <IconMenu />
          </button>
        </div>
      </div>

      {/* ── 모바일 오버레이 ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div
            className="w-64 h-full bg-slate-900 text-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
              <div>
                <span className="font-bold text-lg">등록 플랫폼</span>
                <span className={`ml-2 text-xs ${roleBg} px-2 py-0.5 rounded-full`}>{roleLabel}</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <nav className="flex flex-col gap-1 p-4 flex-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive(item.href, item.exact)
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}>
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-700 flex flex-col gap-2">
              <div className="px-2 mb-1">
                <p className="text-xs text-slate-500">로그인 계정</p>
                <p className="text-sm text-slate-300 mt-0.5 truncate">{adminName}</p>
              </div>
              <button onClick={handleLogout} disabled={loggingOut}
                className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50">
                <IconLogout />
                {loggingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
              <a href="/" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors">
                <IconHome />홈으로
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── 데스크탑 사이드바 ── */}
      <aside className={`hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-30 bg-slate-900 text-white transition-all duration-300 ${collapsed ? 'w-14' : 'w-56'}`}>

        {/* 헤더 + 토글 버튼 */}
        <div className={`flex items-center border-b border-slate-700 h-14 shrink-0 ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-bold text-base whitespace-nowrap">등록 플랫폼</span>
              <span className={`ml-2 text-xs ${roleBg} px-2 py-0.5 rounded-full`}>{roleLabel}</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${collapsed ? '' : 'shrink-0'}`}
            title={collapsed ? '사이드바 열기' : '사이드바 닫기'}
          >
            {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
          </button>
        </div>

        {/* 네비게이션 */}
        <nav className="flex flex-col gap-1 p-2 flex-1 overflow-hidden">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg text-sm transition-colors ${
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
              } ${
                isActive(item.href, item.exact)
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}>
              {item.icon}
              {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* 푸터 */}
        <div className={`border-t border-slate-700 flex flex-col gap-1 p-2 shrink-0 ${collapsed ? 'items-center' : ''}`}>
          {!collapsed && (
            <div className="px-3 py-1 mb-1">
              <p className="text-xs text-slate-500">로그인 계정</p>
              <p className="text-sm text-slate-300 mt-0.5 truncate max-w-[160px]">{adminName}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? '로그아웃' : undefined}
            className={`flex items-center gap-3 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 py-2.5 ${
              collapsed ? 'justify-center px-0 w-10' : 'px-3 w-full'
            }`}
          >
            <IconLogout />
            {!collapsed && <span>{loggingOut ? '로그아웃 중...' : '로그아웃'}</span>}
          </button>
          <a
            href="/"
            title={collapsed ? '홈으로' : undefined}
            className={`flex items-center gap-3 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors py-2.5 ${
              collapsed ? 'justify-center px-0 w-10' : 'px-3 w-full'
            }`}
          >
            <IconHome />
            {!collapsed && <span>홈으로</span>}
          </a>
        </div>
      </aside>
    </>
  )
}
