'use client'

import { useState } from 'react'
import type { Event } from '@/lib/types'
import TemplatesTab from './TemplatesTab'
import SendTab from './SendTab'
import HistoryTab from './HistoryTab'

const TABS = [
  { id: 'templates', label: '템플릿 관리' },
  { id: 'send',      label: '발송하기' },
  { id: 'history',   label: '발송 현황' },
] as const

type TabId = typeof TABS[number]['id']

export default function EmailTab({ event }: { event: Event }) {
  const [tab, setTab] = useState<TabId>('templates')

  return (
    <div className="flex flex-col gap-5">

      {/* 탭 네비게이션 */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === 'templates' && <TemplatesTab event={event} />}
      {tab === 'send'      && <SendTab event={event} />}
      {tab === 'history'   && <HistoryTab event={event} />}
    </div>
  )
}
