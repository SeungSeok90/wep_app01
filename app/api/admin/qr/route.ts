import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

function generateCode(): string {
  return randomBytes(4).toString('hex') // 8자리 hex (예: a3f2c1b4)
}

// QR 목록 조회
export async function GET() {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('qr_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// QR 생성
export async function POST(request: Request) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { name, target_url, description } = await request.json()
  if (!name || !target_url) {
    return NextResponse.json({ error: '이름과 대상 URL은 필수입니다.' }, { status: 400 })
  }

  // URL 형식 검증
  try { new URL(target_url) } catch {
    return NextResponse.json({ error: '유효한 URL 형식이 아닙니다.' }, { status: 400 })
  }

  // 중복 없는 code 생성
  let code = generateCode()
  let attempts = 0
  while (attempts < 5) {
    const { data: existing } = await supabaseAdmin.from('qr_codes').select('id').eq('code', code).single()
    if (!existing) break
    code = generateCode()
    attempts++
  }

  const { data, error } = await supabaseAdmin
    .from('qr_codes')
    .insert({ code, name, target_url, description: description || null, created_by: adminUser.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
