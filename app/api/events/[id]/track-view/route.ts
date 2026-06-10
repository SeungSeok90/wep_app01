import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

type Params = { params: Promise<{ id: string }> }

function parseUA(ua: string) {
  const s = ua.toLowerCase()

  let device_type = 'desktop'
  if (/ipad|tablet|(android(?!.*mobile))/.test(s)) device_type = 'tablet'
  else if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(s)) device_type = 'mobile'

  let browser = '기타'
  if (s.includes('edg/')) browser = 'Edge'
  else if (s.includes('samsungbrowser')) browser = 'Samsung'
  else if (s.includes('chrome/') && !s.includes('chromium')) browser = 'Chrome'
  else if (s.includes('firefox/')) browser = 'Firefox'
  else if (s.includes('safari/') && !s.includes('chrome')) browser = 'Safari'
  else if (s.includes('opera') || s.includes('opr/')) browser = 'Opera'

  let os = '기타'
  if (s.includes('windows')) os = 'Windows'
  else if (s.includes('iphone') || s.includes('ipad') || s.includes('ipod')) os = 'iOS'
  else if (s.includes('android')) os = 'Android'
  else if (s.includes('mac os') || s.includes('macintosh')) os = 'macOS'
  else if (s.includes('linux')) os = 'Linux'

  return { device_type, browser, os }
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id: event_id } = await params
    const h = await headers()

    const ua = h.get('user-agent') ?? ''
    const country = h.get('x-vercel-ip-country') ?? null
    const city = h.get('x-vercel-ip-city') ? decodeURIComponent(h.get('x-vercel-ip-city')!) : null
    const referer = h.get('referer') ?? null

    // referer를 도메인만 남김
    let referrer: string | null = null
    if (referer) {
      try { referrer = new URL(referer).hostname } catch { referrer = referer.slice(0, 100) }
    }

    const { device_type, browser, os } = parseUA(ua)

    await supabase.from('event_views').insert({
      event_id,
      country,
      city,
      browser,
      os,
      device_type,
      referrer,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
