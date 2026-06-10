import { getAdminUser } from '@/lib/auth'
import AdminSidebar from './AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminUser()

  // 로그인 페이지 — 사이드바 없이 렌더링 (미들웨어가 인증 처리)
  if (!adminUser) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <AdminSidebar role={adminUser.role} adminName={adminUser.name ?? adminUser.email} />
      <div className="pt-14 lg:pt-0 lg:pl-56">
        {children}
      </div>
    </div>
  )
}
