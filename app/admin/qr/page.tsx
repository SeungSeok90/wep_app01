import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import QrClient from './QrClient'

export default async function QrPage() {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/admin/login')

  const { data } = await supabaseAdmin
    .from('qr_codes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <QrClient initial={data ?? []} />
    </div>
  )
}
