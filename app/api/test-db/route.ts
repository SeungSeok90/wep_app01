import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase.from('_test').select('*').limit(1)

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: 'connected', message: 'Supabase 연결 성공!' })
}
