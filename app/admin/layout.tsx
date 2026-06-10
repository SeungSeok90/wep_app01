import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth'
import AdminSidebar from './AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminUser()

  if (!adminUser) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <AdminSidebar role={adminUser.role} adminName={adminUser.name ?? adminUser.email} />
      <div className="pt-14 lg:pt-0 lg:pl-56">
        {children}
      </div>
    </div>
  )
}
