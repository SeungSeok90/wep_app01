import { getAdminUser } from '@/lib/auth'
import AdminShell from './AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminUser()

  if (!adminUser) {
    return <>{children}</>
  }

  return (
    <AdminShell adminUser={adminUser}>
      {children}
    </AdminShell>
  )
}
