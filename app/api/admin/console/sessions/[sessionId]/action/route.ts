import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ sessionId: string }> }
type ActionType = 'start' | 'next-slide' | 'end' | 'reset'

export async function POST(request: Request, { params }: Params) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { sessionId } = await params
  const { action } = (await request.json()) as { action: ActionType }

  const { data: session, error: fetchError } = await supabaseAdmin
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (fetchError || !session) return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 })

  let update: Record<string, unknown> = {}

  if (action === 'start') {
    if (session.status === 'live') return NextResponse.json({ error: '이미 진행 중인 세션입니다.' }, { status: 400 })
    update = { status: 'live', started_at: new Date().toISOString(), current_slide: 1 }
  } else if (action === 'next-slide') {
    if (session.status !== 'live') return NextResponse.json({ error: '진행 중인 세션이 아닙니다.' }, { status: 400 })
    const next = Math.min(session.current_slide + 1, session.total_slides || 999)
    update = { current_slide: next }
  } else if (action === 'end') {
    if (session.status !== 'live') return NextResponse.json({ error: '진행 중인 세션이 아닙니다.' }, { status: 400 })
    update = { status: 'completed', completed_at: new Date().toISOString() }
  } else if (action === 'reset') {
    update = { status: 'ready', started_at: null, completed_at: null, current_slide: 0 }
  } else {
    return NextResponse.json({ error: '알 수 없는 액션입니다.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .update(update)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
