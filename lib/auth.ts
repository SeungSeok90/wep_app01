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
  try {
    const client = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await client.auth.getUser()
    if (authError) console.error('[auth] getUser error:', authError.message)
    if (!user) return null

    const { data, error: dbError } = await client
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (dbError) console.error('[auth] admin_users query error:', dbError.message)
    return (data as AdminUser) ?? null
  } catch (e) {
    console.error('[auth] unexpected error:', e)
    return null
  }
}
