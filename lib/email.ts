import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface ConfirmationEmailParams {
  to: string
  registrantName: string
  eventName: string
  eventDate: string | null
  location: string | null
  attendanceType: 'offline' | 'online'
  eventType: 'offline' | 'online' | 'hybrid'
  slug: string
  subject?: string | null
  origin: string
}

export async function sendConfirmationEmail(params: ConfirmationEmailParams) {
  const {
    to, registrantName, eventName, eventDate, location,
    attendanceType, eventType, slug, subject, origin,
  } = params

  const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
  const resolvedSubject = subject?.trim() || `[${eventName}] 등록이 완료되었습니다`
  const isOnline = attendanceType === 'online'
  const hasLive = eventType !== 'offline'
  const liveUrl = `${origin}/${slug}/live`

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
        weekday: 'long', hour: '2-digit', minute: '2-digit',
      })
    : null

  const attendanceLabel = isOnline ? '온라인 참석' : '현장 참석'

  const html = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <!-- 헤더 -->
        <tr>
          <td style="background:#6366f1;padding:32px 40px;">
            <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">등록 완료</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">${eventName}</h1>
          </td>
        </tr>

        <!-- 본문 -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 24px;color:#1e293b;font-size:15px;line-height:1.6;">
              안녕하세요, <strong>${registrantName}</strong>님.<br>
              행사 등록이 성공적으로 완료되었습니다.
            </p>

            <!-- 정보 카드 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                ${formattedDate ? `
                <div style="display:flex;margin-bottom:14px;">
                  <span style="color:#6366f1;font-size:15px;width:24px;flex-shrink:0;">📅</span>
                  <div style="margin-left:10px;">
                    <p style="margin:0;font-size:12px;color:#94a3b8;">행사 일시</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#1e293b;font-weight:500;">${formattedDate}</p>
                  </div>
                </div>` : ''}
                ${!isOnline && location ? `
                <div style="display:flex;margin-bottom:14px;">
                  <span style="color:#6366f1;font-size:15px;width:24px;flex-shrink:0;">📍</span>
                  <div style="margin-left:10px;">
                    <p style="margin:0;font-size:12px;color:#94a3b8;">장소</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#1e293b;font-weight:500;">${location}</p>
                  </div>
                </div>` : ''}
                <div style="display:flex;">
                  <span style="color:#6366f1;font-size:15px;width:24px;flex-shrink:0;">🎫</span>
                  <div style="margin-left:10px;">
                    <p style="margin:0;font-size:12px;color:#94a3b8;">참석 방식</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#1e293b;font-weight:500;">${attendanceLabel}</p>
                  </div>
                </div>
              </td></tr>
            </table>

            ${hasLive && isOnline ? `
            <!-- 라이브 입장 버튼 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 12px;color:#475569;font-size:14px;">행사 당일 아래 버튼으로 입장하세요.</p>
                <a href="${liveUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">라이브 입장하기 →</a>
              </td></tr>
            </table>` : ''}

            <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
              문의 사항이 있으시면 행사 담당자에게 연락해 주세요.
            </p>
          </td>
        </tr>

        <!-- 푸터 -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;color:#cbd5e1;font-size:12px;">이 메일은 행사 등록 확인을 위해 자동 발송되었습니다.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const { error } = await resend.emails.send({ from, to, subject: resolvedSubject, html })
  if (error) throw new Error(error.message)
}
