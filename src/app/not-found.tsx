'use client'

import { useEffect, useState } from 'react'
import TicketPageClient from './ticket/[id]/TicketPageClient'

// 404ページをSPAフォールバックとして使用
// /ticket/{id} へのアクセス時、このページが表示され
// クライアントサイドでURLからIDを取得してチケットを表示

export default function NotFound() {
  const [isTicketPage, setIsTicketPage] = useState(false)
  const [ticketId, setTicketId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname
      // /ticket/{id} パターンをチェック
      const ticketMatch = pathname.match(/^\/ticket\/([^\/]+)\/?$/)
      if (ticketMatch && ticketMatch[1]) {
        setTicketId(ticketMatch[1])
        setIsTicketPage(true)
      }
    }
  }, [])

  // /ticket/{id} の場合はチケットページを表示
  if (isTicketPage && ticketId) {
    return <TicketPageClient id={ticketId} />
  }

  // それ以外は通常の404ページ
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">ページが見つかりません</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          トップページへ戻る
        </a>
      </div>
    </div>
  )
}
