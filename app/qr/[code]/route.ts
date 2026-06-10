import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ code: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { code } = await params

  const { data } = await supabaseAdmin
    .from('qr_codes')
    .select('id, target_url, is_active, scan_count')
    .eq('code', code)
    .single()

  if (!data) {
    return new NextResponse('QR 코드를 찾을 수 없습니다.', { status: 404 })
  }

  if (!data.is_active) {
    return new NextResponse('비활성화된 QR 코드입니다.', { status: 410 })
  }

  // 스캔 수 증가 (응답 먼저 보내고 비동기 처리)
  supabaseAdmin
    .from('qr_codes')
    .update({ scan_count: data.scan_count + 1, updated_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})

  return NextResponse.redirect(data.target_url, { status: 302 })
}
