import type { SessionWithTiming } from '@/lib/types'

/** 콘솔/대시보드 화면에서 세션을 다룰 때 트랙 이름을 함께 들고 다니기 위한 뷰 타입 */
export type ConsoleSession = SessionWithTiming & { track_name: string }
