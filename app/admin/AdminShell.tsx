'use client'

import { useState, useEffect } from 'react'
import AdminSidebar from './AdminSidebar'

interface AdminUser {
  role: 'super' | 'staff'
  name: string | null
  email: string
}

interface Props {
  adminUser: AdminUser
  children: React.ReactNode
}

export default function AdminShell({ adminUser, children }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
    setMounted(true)
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  // 마운트 전엔 expanded 상태로 렌더(깜빡임 방지)
  const isCollapsed = mounted ? collapsed : false

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <AdminSidebar
        role={adminUser.role}
        adminName={adminUser.name ?? adminUser.email}
        collapsed={isCollapsed}
        onToggle={toggle}
      />
      <div
        className={`transition-all duration-300 pt-14 lg:pt-0 ${
          isCollapsed ? 'lg:pl-14' : 'lg:pl-56'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
