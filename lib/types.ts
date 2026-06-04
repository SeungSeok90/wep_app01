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
  checked_in_at: string | null
}

export interface NametagFieldStyle {
  visible: boolean
  fontSize: number
  bold: boolean
  align: 'left' | 'center' | 'right'
  color: string
  fontFamily: string
}

export interface NametagTemplate {
  width_mm: number
  height_mm: number
  per_page: 1 | 2 | 4 | 6
  background: string
  fields: {
    event_name: NametagFieldStyle
    name: NametagFieldStyle
    company: NametagFieldStyle
    department: NametagFieldStyle
    position: NametagFieldStyle
  }
  qr: {
    visible: boolean
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
    size: 'small' | 'medium' | 'large'
  }
}

export const DEFAULT_NAMETAG_TEMPLATE: NametagTemplate = {
  width_mm: 90,
  height_mm: 54,
  per_page: 4,
  background: '#ffffff',
  fields: {
    event_name: { visible: true, fontSize: 9,  bold: false, align: 'center', color: '#888888', fontFamily: 'sans-serif' },
    name:       { visible: true, fontSize: 22, bold: true,  align: 'center', color: '#000000', fontFamily: 'sans-serif' },
    company:    { visible: true, fontSize: 13, bold: false, align: 'center', color: '#333333', fontFamily: 'sans-serif' },
    department: { visible: true, fontSize: 11, bold: false, align: 'center', color: '#555555', fontFamily: 'sans-serif' },
    position:   { visible: true, fontSize: 11, bold: false, align: 'center', color: '#555555', fontFamily: 'sans-serif' },
  },
  qr: { visible: true, position: 'top-right', size: 'medium' },
}
