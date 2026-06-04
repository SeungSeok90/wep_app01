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

export interface NametagElement {
  id: string
  type: 'field' | 'qr'
  fieldKey: string       // 'name' | 'company' | ... | custom field label
  fieldLabel: string     // 화면 표시용
  x: number              // mm (캔버스 좌상단 기준)
  y: number              // mm
  // field 전용
  fontSize: number
  bold: boolean
  color: string
  align: 'left' | 'center' | 'right'
  fontFamily: string
  // qr 전용
  size?: number          // mm
}

export interface NametagTemplate {
  width_mm: number
  height_mm: number
  background: string
  elements: NametagElement[]
}

export const DEFAULT_NAMETAG_TEMPLATE: NametagTemplate = {
  width_mm: 90,
  height_mm: 54,
  background: '#ffffff',
  elements: [
    { id: 'el-name',       type: 'field', fieldKey: 'name',       fieldLabel: '이름',   x: 5,  y: 18, fontSize: 22, bold: true,  color: '#000000', align: 'left', fontFamily: 'sans-serif' },
    { id: 'el-company',    type: 'field', fieldKey: 'company',    fieldLabel: '회사명', x: 5,  y: 33, fontSize: 13, bold: false, color: '#333333', align: 'left', fontFamily: 'sans-serif' },
    { id: 'el-department', type: 'field', fieldKey: 'department', fieldLabel: '부서',   x: 5,  y: 42, fontSize: 11, bold: false, color: '#555555', align: 'left', fontFamily: 'sans-serif' },
    { id: 'el-position',   type: 'field', fieldKey: 'position',   fieldLabel: '직급',   x: 5,  y: 48, fontSize: 11, bold: false, color: '#555555', align: 'left', fontFamily: 'sans-serif' },
    { id: 'el-qr',         type: 'qr',   fieldKey: 'qr',         fieldLabel: 'QR코드', x: 60, y: 7,  fontSize: 0,  bold: false, color: '#000000', align: 'left', fontFamily: 'sans-serif', size: 40 },
  ],
}
