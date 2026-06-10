import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import StaffClient from './StaffClient'

export default async function StaffPage() {
  const adminUser = await getAdminUser()
  if (adminUser?.role !== 'super') redirect('/admin')

  const [{ data: staffList }, { data: events }] = await Promise.all([
    supabase
      .from('admin_users')
      .select('id, email, name, created_at, event_staff(event_id)')
      .eq('role', 'staff')
      .order('created_at', { ascending: false }),
    supabase
      .from('events')
      .select('id, name')
      .order('event_date', { ascending: false }),
  ])

  return (
    <main className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold">담당자 관리</h1>
        <p className="text-slate-500 text-sm mt-1">행사 담당자 계정을 생성하고 행사를 배정합니다.</p>
      </div>
      <StaffClient
        initialStaff={staffList ?? []}
        events={events ?? []}
      />
    </main>
  )
}
