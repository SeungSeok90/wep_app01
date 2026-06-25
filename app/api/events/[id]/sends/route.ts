import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { FROM } from '@/lib/email'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id: event_id } = await params
  const { data, error } = await supabaseAdmin
    .from('message_sends')
    .select('*')
    .eq('event_id', event_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request, { params }: Params) {
  const { id: event_id } = await params
  const body = await req.json()
  const { template_id, registration_ids, filter_config, scheduled_at } = body
  const isScheduled = !!scheduled_at

  // 템플릿 조회
  const { data: tpl, error: tplErr } = await supabaseAdmin
    .from('message_templates')
    .select('*')
    .eq('id', template_id)
    .single()

  if (tplErr || !tpl) {
    return NextResponse.json({ error: '템플릿을 찾을 수 없습니다.' }, { status: 404 })
  }

  // 수신자 조회
  const { data: regs, error: regsErr } = await supabaseAdmin
    .from('registrations')
    .select('id, name, email')
    .in('id', registration_ids)

  if (regsErr || !regs || regs.length === 0) {
    return NextResponse.json({ error: '수신자가 없습니다.' }, { status: 400 })
  }

  // 발송 레코드 생성
  const { data: send, error: sendErr } = await supabaseAdmin
    .from('message_sends')
    .insert({
      event_id,
      template_id,
      template_name: tpl.name,
      subject: tpl.subject,
      body_html: tpl.body_html,
      status: isScheduled ? 'scheduled' : 'sending',
      filter_config,
      scheduled_at: isScheduled ? scheduled_at : null,
      total_count: regs.length,
      started_at: isScheduled ? null : new Date().toISOString(),
    })
    .select()
    .single()

  if (sendErr || !send) {
    return NextResponse.json({ error: '발송 레코드 생성 실패' }, { status: 500 })
  }

  // 로그 레코드 초기 생성
  await supabaseAdmin.from('message_send_logs').insert(
    regs.map((r) => ({
      send_id: send.id,
      registration_id: r.id,
      email: r.email,
      status: 'pending',
    }))
  )

  // 즉시 발송이면 백그라운드 실행, 예약이면 Cron이 처리
  if (!isScheduled) {
    sendEmails(send.id, tpl.subject, tpl.body_html, regs).catch(console.error)
  }

  return NextResponse.json({ send_id: send.id, total: regs.length }, { status: 202 })
}

async function sendEmails(
  sendId: string,
  subject: string,
  bodyHtml: string,
  regs: { id: string; name: string; email: string }[]
) {
  let success = 0
  let fail = 0

  for (const reg of regs) {
    const personalizedHtml = bodyHtml.replace(/\{\{name\}\}/g, reg.name)

    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to: reg.email,
        subject,
        html: personalizedHtml,
      })

      if (error) throw new Error(error.message)

      await supabaseAdmin
        .from('message_send_logs')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('send_id', sendId)
        .eq('registration_id', reg.id)

      success++
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류'
      await supabaseAdmin
        .from('message_send_logs')
        .update({ status: 'failed', error_message: msg })
        .eq('send_id', sendId)
        .eq('registration_id', reg.id)

      fail++
    }

    // Resend 속도 제한 대응 (100ms 간격)
    await new Promise((r) => setTimeout(r, 100))
  }

  await supabaseAdmin
    .from('message_sends')
    .update({
      status: fail === regs.length ? 'failed' : 'completed',
      success_count: success,
      fail_count: fail,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sendId)
}
