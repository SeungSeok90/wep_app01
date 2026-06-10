import { createClient } from '@supabase/supabase-js'

// 서비스 롤 키로 생성 — 사용자 계정 생성 등 관리자 작업에만 사용
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
