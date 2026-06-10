import { createSupabaseServerClient } from './supabase-server'
import { supabaseAdmin } from './supabase-admin'

export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: 'super' | 'staff'
  created_at: string
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const client = await createSupabaseServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return null

  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (data as AdminUser) ?? null
}
