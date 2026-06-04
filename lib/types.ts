export type FieldType = 'text' | 'select' | 'radio' | 'checkbox' | 'textarea'

export interface Event {
  id: string
  slug: string
  name: string
  location: string | null
  event_date: string | null
  organizer: string | null
  target_count: number | null
  offline_capacity: number | null
  online_capacity: number | null
  register_start: string | null
  register_end: string | null
  type: 'offline' | 'online' | 'hybrid'
  video_url: string | null
  created_at: string
}

export interface EventChannel {
  id: string
  event_id: string
  name: string
  description: string | null
  video_url: string | null
  sort_order: number
  created_at: string
}

export interface WebinarChat {
  id: string
  event_id: string
  channel_id: string | null
  user_name: string
  message: string
  created_at: string
}

export interface EventField {
  id: string
  event_id: string
  label: string
  field_type: FieldType
  is_required: boolean
  options: string[] | null
  sort_order: number
}

export interface Registration {
  id: string
  event_id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  department: string | null
  position: string | null
  attendance_type: 'offline' | 'online'
  custom_answers: Record<string, string | string[]>
  registered_at: string
}
