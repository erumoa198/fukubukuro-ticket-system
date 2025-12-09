'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@/lib/supabase'
import { TicketSetWithTickets, SET_TYPE_NAMES, Ticket } from '@/types'
import { isDemoMode, getDemoTicketSet, getDemoTickets } from '@/lib/demo-data'

// 個別チケットコンポーネント（明るいモダンスタイル）
function TicketCard({ ticket, index }: { ticket: Ticket; index: number }) {
  const isUsed = ticket.is_used

  return (
    <div
      className="animate-slide-up"
      style={{
        animationDelay: `${index * 0.1}s`,
        animationFillMode: 'forwards',
        opacity: 0
      }}
    >
      {/* カード */}
      <div
        className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        style={{
          background: isUsed ? '#f5f5f5' : 'white',
          border: isUsed ? '1px solid #e0e0e0' : '1px solid rgba(212, 165, 116, 0.3)',
          boxShadow: isUsed ? 'none' : '0 4px 20px rgba(212, 165, 116, 0.15)',
          opacity: isUsed ? 0.7 : 1,
        }}
      >
        {/* 上部：チケット情報 */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3
                className="font-bold text-lg mb-1"
                style={{ color: isUsed ? '#999' : '#3d3d3d' }}
              >
                {ticket.ticket_name}
              </h3>
              {ticket.ticket_description && (
                <p
                  className="text-sm"
                  style={{ color: isUsed ? '#bbb' : '#888' }}
                >
                  {ticket.ticket_description}
                </p>
              )}
            </div>
            <div
              className="px-3 py-1 rounded-xl text-xs font-semibold shrink-0"
              style={{
                background: isUsed ? '#e0e0e0' : 'linear-gradient(135deg, #10b981, #059669)',
                color: isUsed ? '#999' : 'white',
              }}
            >
              {isUsed ? '使用済' : '有効'}
            </div>
          </div>
        </div>

        {/* 切り取り線 */}
        <div className="flex items-center">
          <div
            className="w-5 h-5 rounded-full -ml-2.5"
            style={{ background: 'linear-gradient(180deg, #fef7ed, #fdf2e6)' }}
          />
          <div
            className="flex-1"
            style={{ borderTop: isUsed ? '2px dashed #ddd' : '2px dashed #d4a574' }}
          />
          <div
            className="w-5 h-5 rounded-full -mr-2.5"
            style={{ background: 'linear-gradient(180deg, #fef7ed, #fdf2e6)' }}
          />
        </div>

        {/* 下部：詳細情報 */}
        {!isUsed ? (
          <div className="px-5 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-wider" style={{ color: '#aaa' }}>TYPE</span>
              <span
                className="w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, #d4a574, #c9956a)',
                  color: 'white'
                }}
              >
                {ticket.ticket_type}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#888' }}>
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#10b981' }}
              />
              <span>有効</span>
            </div>
          </div>
        ) : (
          <div className="px-5 py-3 text-center text-xs" style={{ color: '#aaa' }}>
            {ticket.used_at && new Date(ticket.used_at).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
            に使用
            {ticket.used_menu && ` · ${ticket.used_menu}`}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TicketPage() {
  const params = useParams()
  const setId = params.id as string
  const [ticketSet, setTicketSet] = useState<TicketSetWithTickets | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTicketSet = async () => {
      try {
        if (isDemoMode) {
          const demoSet = getDemoTicketSet(setId)
          if (!demoSet) throw new Error('チケットが見つかりません')

          const demoTickets = getDemoTickets(setId)
          setTicketSet({
            ...demoSet,
            tickets: demoTickets
          })
        } else {
          const { data: setData, error: setError } = await supabase
            .from('ticket_sets')
            .select('*')
            .eq('id', setId)
            .single()

          if (setError) throw setError
          if (!setData) throw new Error('チケットが見つかりません')

          const { data: ticketsData, error: ticketsError } = await supabase
            .from('tickets')
            .select('*')
            .eq('set_id', setId)
            .order('created_at', { ascending: true })

          if (ticketsError) throw ticketsError

          setTicketSet({
            ...setData,
            tickets: ticketsData || []
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchTicketSet()

    if (!isDemoMode) {
      const channel = supabase
        .channel(`ticket-${setId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `set_id=eq.${setId}` },
          (payload) => {
            setTicketSet(prev => {
              if (!prev) return prev
              return {
                ...prev,
                tickets: prev.tickets.map(t =>
                  t.id === payload.new.id ? { ...t, ...payload.new } : t
                )
              }
            })
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const interval = setInterval(() => {
      const demoSet = getDemoTicketSet(setId)
      if (demoSet) {
        const demoTickets = getDemoTickets(setId)
        setTicketSet({
          ...demoSet,
          tickets: demoTickets
        })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [setId])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: '福袋チケット',
          text: '福袋チケットをお送りします',
          url: url
        })
      } catch {
        // ユーザーがキャンセルした場合
      }
    } else {
      await navigator.clipboard.writeText(url)
      alert('URLをコピーしました')
    }
  }

  const handleGift = async () => {
    const url = window.location.href
    const text = `福袋チケットをプレゼントします！\n\n${SET_TYPE_NAMES[ticketSet?.set_type || 'artmake_repeater']}\n\n以下のリンクからチケットをご確認ください：`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'チケットをプレゼント',
          text: text,
          url: url
        })
      } catch {
        // ユーザーがキャンセルした場合
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      alert('ギフト用メッセージをコピーしました')
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #fef7ed 0%, #fdf2e6 50%, #fce8d5 100%)' }}
      >
        <div className="text-center">
          <div className="animate-pulse flex justify-center">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={240}
              height={90}
              className="w-full max-w-[200px] sm:max-w-[240px] h-auto"
              priority
            />
          </div>
          <p className="mt-4 text-sm tracking-wide" style={{ color: '#a08060' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !ticketSet) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(180deg, #fef7ed 0%, #fdf2e6 50%, #fce8d5 100%)' }}
      >
        <div
          className="text-center p-8 max-w-sm rounded-3xl"
          style={{
            background: 'white',
            boxShadow: '0 10px 40px rgba(212, 165, 116, 0.2)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239, 68, 68, 0.1)' }}
          >
            <svg className="w-8 h-8" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="font-medium mb-2" style={{ color: '#3d3d3d' }}>{error || 'チケットが見つかりません'}</p>
          <p className="text-sm" style={{ color: '#888' }}>URLをご確認ください</p>
        </div>
      </div>
    )
  }

  const usedCount = ticketSet.tickets.filter(t => t.is_used).length
  const totalCount = ticketSet.tickets.length
  const remainingCount = totalCount - usedCount
  const isExpired = new Date(ticketSet.expires_at) < new Date()
  const allUsed = remainingCount === 0

  return (
    <main
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'linear-gradient(180deg, #fef7ed 0%, #fdf2e6 50%, #fce8d5 100%)' }}
    >
      {/* 背景デコレーション */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full animate-float-slow"
          style={{
            width: 300,
            height: 300,
            background: 'linear-gradient(135deg, #f8d7c4, #f5c6a8)',
            top: -100,
            right: -100,
            filter: 'blur(80px)',
            opacity: 0.6,
          }}
        />
        <div
          className="absolute rounded-full animate-float-slow-reverse"
          style={{
            width: 250,
            height: 250,
            background: 'linear-gradient(135deg, #e6c76d, #f5deb0)',
            bottom: '20%',
            left: -80,
            filter: 'blur(80px)',
            opacity: 0.5,
          }}
        />
        <div
          className="absolute rounded-full animate-float-slower"
          style={{
            width: 200,
            height: 200,
            background: 'linear-gradient(135deg, #d4a574, #e8c4a0)',
            bottom: -50,
            right: '10%',
            filter: 'blur(80px)',
            opacity: 0.5,
          }}
        />
      </div>

      {/* ヘッダー */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(212, 165, 116, 0.2)',
        }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <a
            href="/"
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:scale-105"
            style={{ background: 'rgba(212, 165, 116, 0.1)' }}
          >
            <svg className="w-5 h-5" style={{ color: '#a08060' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          {/* ロゴ（大きめ表示・中央配置） */}
          <Image
            src="/images/logo.png"
            alt="Navi Medical"
            width={200}
            height={75}
            className="w-full max-w-[140px] sm:max-w-[160px] h-auto"
            priority
          />
          <button
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:scale-105"
            style={{ background: 'rgba(212, 165, 116, 0.1)' }}
          >
            <svg className="w-5 h-5" style={{ color: '#a08060' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 pb-12 relative z-10">
        {/* タイトルセクション */}
        <section className="text-center py-8 animate-fade-in">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest mb-3"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.2), rgba(200, 150, 100, 0.2))',
              border: '1px solid rgba(212, 165, 116, 0.4)',
              color: '#a08060',
            }}
          >
            SPECIAL TICKET
          </span>
          <h1 className="text-2xl font-bold mb-6" style={{ color: '#3d3d3d' }}>
            {SET_TYPE_NAMES[ticketSet.set_type]}
          </h1>

          {/* 進捗インジケーター */}
          <div className="max-w-[280px] mx-auto">
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(212, 165, 116, 0.2)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(remainingCount / totalCount) * 100}%`,
                  background: 'linear-gradient(90deg, #d4a574, #c9956a)',
                }}
              />
            </div>
            <p className="mt-2 text-sm" style={{ color: '#888' }}>
              {allUsed ? 'すべて使用済み' : `残り ${remainingCount}/${totalCount} 枚`}
            </p>
          </div>

          {isExpired && (
            <div
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#dc2626',
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              有効期限切れ
            </div>
          )}
        </section>

        {/* チケット一覧 */}
        <section className="flex flex-col gap-4 mb-8">
          {ticketSet.tickets.map((ticket, index) => (
            <TicketCard key={ticket.id} ticket={ticket} index={index} />
          ))}
        </section>

        {/* QRコードセクション */}
        {!isExpired && !allUsed && (
          <section className="text-center mb-8">
            <div
              className="inline-block p-6 rounded-3xl"
              style={{
                background: 'white',
                boxShadow: '0 10px 40px rgba(212, 165, 116, 0.2)',
                border: '1px solid rgba(212, 165, 116, 0.2)',
              }}
            >
              <div className="mb-4">
                <span className="block text-xs tracking-widest mb-1" style={{ color: '#aaa' }}>SCAN TO USE</span>
                <span className="font-semibold" style={{ color: '#3d3d3d' }}>ご提示用QRコード</span>
              </div>
              <div
                className="p-4 rounded-2xl inline-block"
                style={{ background: '#faf8f5' }}
              >
                <QRCodeSVG
                  value={typeof window !== 'undefined' ? window.location.href : ''}
                  size={180}
                  level="M"
                  includeMargin={false}
                  fgColor="#3d3d3d"
                  bgColor="#faf8f5"
                />
              </div>
              <div className="mt-4 flex justify-between text-xs" style={{ color: '#aaa' }}>
                <span>ID: {setId.slice(0, 8).toUpperCase()}</span>
                <span>
                  〜{new Date(ticketSet.expires_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm" style={{ color: '#888' }}>
              ご来院時にスタッフへお見せください
            </p>
          </section>
        )}

        {/* チケットを贈るボタン */}
        {!isExpired && !allUsed && (
          <section className="text-center mb-8">
            <button
              onClick={handleGift}
              className="w-full max-w-xs py-4 px-6 rounded-2xl font-semibold transition-all hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3 mx-auto"
              style={{
                background: 'linear-gradient(135deg, #d4a574, #c9956a)',
                color: 'white',
                boxShadow: '0 4px 20px rgba(212, 165, 116, 0.4)',
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              チケットを贈る
            </button>
            <p className="mt-2 text-xs" style={{ color: '#aaa' }}>
              大切な方へチケットをプレゼントできます
            </p>
          </section>
        )}

        {/* フッター */}
        <footer className="text-center text-xs mt-12" style={{ color: '#aaa' }}>
          <p>有効期限: {new Date(ticketSet.expires_at).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.05); }
        }
        @keyframes float-slow-reverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 20px) scale(1.05); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, -15px) scale(1.03); }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-slow-reverse {
          animation: float-slow-reverse 10s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 12s ease-in-out infinite;
        }
      `}</style>
    </main>
  )
}
