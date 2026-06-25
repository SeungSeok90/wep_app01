import { supabaseAdmin } from '@/lib/supabase-admin'
import { FROM } from '@/lib/email'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: Request) {
  // Vercel Cron 요청 검증
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()

  // 발송 시각이 된 예약 발송 건 조회
  const { data: sends, error } = await supabaseAdmin
    .from('message_sends')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .limit(10) // 한 번에 최대 10건 처리

  if (error) {
    console.error('[cron] sends 조회 실패:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!sends || sends.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0

  for (const send of sends) {
    // 중복 실행 방지 — sending으로 먼저 상태 변경
    const { error: lockErr } = await supabaseAdmin
      .from('message_sends')
      .update({ status: 'sending', started_at: new Date().toISOString() })
      .eq('id', send.id)
      .eq('status', 'scheduled') // 이미 처리 중이면 skip

    if (lockErr) continue

    // 수신자 로그 조회
    const { data: logs } = await supabaseAdmin
      .from('message_send_logs')
      .select('registration_id, email')
      .eq('send_id', send.id)
      .eq('status', 'pending')

    if (!logs || logs.length === 0) {
      await supabaseAdmin
        .from('message_sends')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', send.id)
      continue
    }

    // 수신자 이름 조회
    const regIds = logs.map((l) => l.registration_id)
    const { data: regs } = await supabaseAdmin
      .from('registrations')
      .select('id, name')
      .in('id', regIds)

    const nameMap = Object.fromEntries((regs ?? []).map((r) => [r.id, r.name]))

    let success = 0
    let fail = 0

    for (const log of logs) {
      const name = nameMap[log.registration_id] ?? ''
      const personalizedHtml = send.body_html.replace(/\{\{name\}\}/g, name)

      try {
        const { error: mailErr } = await resend.emails.send({
          from: FROM,
          to: log.email,
          subject: send.subject,
          html: personalizedHtml,
        })

        if (mailErr) throw new Error(mailErr.message)

        await supabaseAdmin
          .from('message_send_logs')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('send_id', send.id)
          .eq('registration_id', log.registration_id)

        success++
      } catch (e) {
        const msg = e instanceof Error ? e.message : '알 수 없는 오류'
        await supabaseAdmin
          .from('message_send_logs')
          .update({ status: 'failed', error_message: msg })
          .eq('send_id', send.id)
          .eq('registration_id', log.registration_id)

        fail++
      }

      await new Promise((r) => setTimeout(r, 100))
    }

    await supabaseAdmin
      .from('message_sends')
      .update({
        status: fail === logs.length ? 'failed' : 'completed',
        success_count: success,
        fail_count: fail,
        completed_at: new Date().toISOString(),
      })
      .eq('id', send.id)

    processed++
  }

  return NextResponse.json({ processed })
}
