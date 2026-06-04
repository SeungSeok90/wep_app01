import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import type { NametagTemplate } from '@/lib/types'
import { DEFAULT_NAMETAG_TEMPLATE } from '@/lib/types'
import AttendClient from './AttendClient'

export default async function AttendPage({ params }: { params: Promise<{ registrationId: string }> }) {
  const { registrationId } = await params

  const { data: registration, error } = await supabase
    .from('registrations')
    .select('*, events(id, name, event_date, location, nametag_template)')
    .eq('id', registrationId)
    .single()

  if (error || !registration) notFound()

  const event = registration.events
  const template: NametagTemplate = event?.nametag_template ?? DEFAULT_NAMETAG_TEMPLATE

  return (
    <AttendClient
      registration={registration}
      event={event}
      template={template}
    />
  )
}
