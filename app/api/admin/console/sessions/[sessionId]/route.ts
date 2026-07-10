import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { Session } from '@/lib/types'

type Params = { params: Promise<{ sessionId: string }> }

// 클라이언트가 patch로 보낼 수 있는 필드 화이트리스트. id/created_at은 불변이라 제외.
const PATCHABLE_KEYS: (keyof Session)[] = [
  'track_id', 'title', 'speaker', 'company', 'category',
  'planned_start_at', 'planned_end_at', 'total_slides', 'current_slide',
  'status', 'rehearsal_notes', 'started_at', 'completed_at', 'issue_note',
  'has_video', 'video_pages', 'video_has_audio', 'is_distributable', 'content_note',
  'speaker_consent_status', 'rehearsal_status', 'chair_count', 'pin_mic_count',
  'hand_mic_count', 'av_check_status', 'setup_note', 'special_requests', 'operator_note',
]

function sanitizePatch(body: unknown): Partial<Session> {
  if (!body || typeof body !== 'object') return {}
  const out: Partial<Session> = {}
  for (const key of PATCHABLE_KEYS) {
    if (key in (body as Record<string, unknown>)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (out as any)[key] = (body as Record<string, unknown>)[key]
    }
  }
  return out
}

export async function PUT(request: Request, { params }: Params) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { sessionId } = await params
  const body = await request.json()
  const patch = sanitizePatch(body)

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .update(patch)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const adminUser = await getAdminUser()
  if (!adminUser) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { sessionId } = await params

  const { error } = await supabaseAdmin.from('sessions').delete().eq('id', sessionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
