'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Ticket, TicketSetWithTickets, SET_TYPE_NAMES, TICKET_MENUS, Staff } from '@/types'
import {
  isDemoMode,
  getDemoStaff,
  getDemoTicketSet,
  getDemoTickets,
  getDemoTicketSets,
  updateDemoTicket,
} from '@/lib/demo-data'

// QRスキャナーはクライアントサイドのみ
const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false })

type StaffStep = 'auth' | 'scan' | 'tickets' | 'confirm' | 'complete'

export default function StaffPage() {
  const [step, setStep] = useState<StaffStep>('auth')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [ticketSet, setTicketSet] = useState<TicketSetWithTickets | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [selectedMenu, setSelectedMenu] = useState<string>('')
  const [processing, setProcessing] = useState(false)

  // スタッフリスト取得 & 前回選択の復元
  useEffect(() => {
    const fetchStaff = async () => {
      let staffData: Staff[] = []

      if (isDemoMode) {
        // デモモード: ダミーデータを使用
        staffData = getDemoStaff()
      } else {
        // 本番モード: Supabaseから取得
        const { data } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .order('id')
        staffData = data || []
      }

      setStaffList(staffData)

      // 前回選択したスタッフを復元
      const savedStaffId = localStorage.getItem('selectedStaffId')
      if (savedStaffId) {
        const savedStaff = staffData.find(s => s.id === Number(savedStaffId))
        if (savedStaff) {
          setSelectedStaff(savedStaff)
        }
      }
    }
    fetchStaff()
  }, [])

  // PIN認証（スタッフ個別PIN方式）
  const handlePinSubmit = async () => {
    // 入力されたPINでスタッフを検索
    const matchedStaff = staffList.find(s => s.pin === pin)

    if (matchedStaff) {
      setSelectedStaff(matchedStaff)
      localStorage.setItem('selectedStaffId', String(matchedStaff.id))
      setStep('scan')
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  // QRスキャン結果処理
  const handleQRScan = async (result: string) => {
    try {
      // URLからセットIDを抽出
      const url = new URL(result)
      const pathParts = url.pathname.split('/')
      const setId = pathParts[pathParts.length - 1]

      if (!setId) throw new Error('無効なQRコード')

      if (isDemoMode) {
        // デモモード: ダミーデータを使用
        const demoSet = getDemoTicketSet(setId)
        if (!demoSet) throw new Error('チケットが見つかりません')

        const demoTickets = getDemoTickets(setId)
        setTicketSet({
          ...demoSet,
          tickets: demoTickets
        })
        setStep('tickets')
      } else {
        // 本番モード: Supabaseから取得
        const { data: setData, error: setError } = await supabase
          .from('ticket_sets')
          .select('*')
          .eq('id', setId)
          .single()

        if (setError || !setData) throw new Error('チケットが見つかりません')

        const { data: ticketsData } = await supabase
          .from('tickets')
          .select('*')
          .eq('set_id', setId)
          .order('created_at', { ascending: true })

        setTicketSet({
          ...setData,
          tickets: ticketsData || []
        })
        setStep('tickets')
      }
    } catch {
      alert('QRコードを読み取れませんでした')
    }
  }

  // チケット選択
  const handleTicketSelect = (ticket: Ticket) => {
    if (ticket.is_used) return

    setSelectedTicket(ticket)
    const menus = TICKET_MENUS[ticket.ticket_type]

    if (menus.length > 0) {
      setSelectedMenu('')
      setStep('confirm')
    } else {
      // メニュー選択不要
      setSelectedMenu('')
      setStep('confirm')
    }
  }

  // 消込実行
  const handleUseTicket = async () => {
    if (!selectedTicket || !selectedStaff) return

    setProcessing(true)
    try {
      const updateData = {
        is_used: true,
        used_at: new Date().toISOString(),
        used_by: selectedStaff.name,
        used_menu: selectedMenu || null
      }

      if (isDemoMode) {
        // デモモード: メモリ上のデータを更新
        updateDemoTicket(selectedTicket.id, updateData)
      } else {
        // 本番モード: Supabaseを更新
        const { error } = await supabase
          .from('tickets')
          .update(updateData)
          .eq('id', selectedTicket.id)

        if (error) throw error
      }

      setStep('complete')
    } catch {
      alert('エラーが発生しました。もう一度お試しください。')
    } finally {
      setProcessing(false)
    }
  }

  // 次のお客様へ
  const handleNext = () => {
    setTicketSet(null)
    setSelectedTicket(null)
    setSelectedMenu('')
    setStep('scan')
  }

  // ログアウト
  const handleLogout = () => {
    setStep('auth')
    setPin('')
    setTicketSet(null)
    setSelectedTicket(null)
    setSelectedMenu('')
  }

  // ステップごとの表示
  const renderContent = () => {
    switch (step) {
      case 'auth':
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">スタッフ認証</h2>
            <p className="text-sm text-gray-500 mb-6">あなたのPINコードを入力してください</p>

            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="PINコードを入力"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && pin.length >= 4 && handlePinSubmit()}
              className="w-full max-w-xs px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 text-base sm:text-2xl"
              maxLength={8}
            />
            {pinError && (
              <p className="text-red-500 text-sm mt-2">PINコードが正しくありません</p>
            )}
            <button
              onClick={handlePinSubmit}
              disabled={pin.length < 4}
              className="btn-gold w-full max-w-xs mt-4 disabled:opacity-50"
            >
              ログイン
            </button>

            {staffList.length === 0 && (
              <p className="text-xs text-gray-400 mt-4">
                ※スタッフが登録されていません。<br />管理画面から登録してください。
              </p>
            )}
          </div>
        )

      case 'scan':
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {isDemoMode ? 'チケット選択' : 'QRスキャン'}
              </h2>
              <span className="text-sm bg-gold-100 text-gold-700 px-3 py-1 rounded-full">
                {selectedStaff?.name}
              </span>
            </div>

            {/* デモモード時：QRスキャナーの代わりにセット選択 */}
            {isDemoMode ? (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  消込するお客様のチケットを選択してください
                </p>
                <div className="space-y-2">
                  {getDemoTicketSets().map((set) => {
                    const tickets = getDemoTickets(set.id)
                    const usedCount = tickets.filter(t => t.is_used).length
                    const totalCount = tickets.length
                    return (
                      <button
                        key={set.id}
                        onClick={() => {
                          setTicketSet({
                            ...set,
                            tickets: tickets
                          })
                          setStep('tickets')
                        }}
                        className="w-full p-4 text-left bg-white border-2 border-gray-200 rounded-xl hover:border-gold-400 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{SET_TYPE_NAMES[set.set_type]}</p>
                            <p className="text-sm text-gray-500">
                              {set.customer_note ? `${set.customer_note}様` : 'お客様メモなし'}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            usedCount === totalCount
                              ? 'bg-gray-200 text-gray-600'
                              : 'bg-gold-100 text-gold-700'
                          }`}>
                            {usedCount}/{totalCount} 使用済
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-amber-600 text-center mt-4">
                  🔧 デモモード：QRスキャンの代わりに直接選択
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  お客様のQRコードをカメラにかざしてください
                </p>
                <QRScanner
                  onScan={handleQRScan}
                  onError={(err) => console.error(err)}
                />
              </>
            )}
          </div>
        )

      case 'tickets':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{ticketSet && SET_TYPE_NAMES[ticketSet.set_type]}</h2>
              <p className="text-sm text-gray-500">使用するチケットを選択</p>
            </div>
            <div className="space-y-3">
              {ticketSet?.tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => handleTicketSelect(ticket)}
                  disabled={ticket.is_used}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    ticket.is_used
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-2 border-gray-200 hover:border-gold-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{ticket.ticket_name}</p>
                      {ticket.ticket_description && (
                        <p className="text-sm text-gray-500">{ticket.ticket_description}</p>
                      )}
                    </div>
                    <span className={ticket.is_used ? 'text-gray-400' : 'text-gold-600'}>
                      {ticket.is_used ? '使用済' : '→'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={handleNext}
              className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← 別のお客様をスキャン
            </button>
          </div>
        )

      case 'confirm':
        const menus = selectedTicket ? TICKET_MENUS[selectedTicket.ticket_type] : []
        return (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-center">使用確認</h2>

            <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
              <p className="text-lg font-medium text-center mb-2">
                {selectedTicket?.ticket_name}
              </p>
              {selectedTicket?.ticket_description && (
                <p className="text-sm text-gray-500 text-center">
                  {selectedTicket.ticket_description}
                </p>
              )}
            </div>

            {menus.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">アイテムを選択</p>
                <div className="grid grid-cols-1 gap-2">
                  {menus.map((menu) => (
                    <button
                      key={menu}
                      onClick={() => setSelectedMenu(menu)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedMenu === menu
                          ? 'border-gold-400 bg-gold-50'
                          : 'border-gray-200 hover:border-gold-300'
                      }`}
                    >
                      {menu}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedTicket(null)
                  setSelectedMenu('')
                  setStep('tickets')
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                戻る
              </button>
              <button
                onClick={handleUseTicket}
                disabled={processing || (menus.length > 0 && !selectedMenu)}
                className="flex-1 btn-gold disabled:opacity-50"
              >
                {processing ? '処理中...' : 'このチケットを使用する'}
              </button>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-green-600 mb-2">使用完了</h2>
            <p className="text-gray-600 mb-2">{selectedTicket?.ticket_name}</p>
            {selectedMenu && (
              <p className="text-sm text-gray-500 mb-6">選択アイテム: {selectedMenu}</p>
            )}
            <button
              onClick={handleNext}
              className="btn-gold w-full max-w-xs"
            >
              次のお客様へ
            </button>
          </div>
        )
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* トップへ戻る */}
        <a href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          トップへ戻る
        </a>

        <header className="py-4 mb-4">
          {/* ロゴ（大きめ表示・中央配置） */}
          <div className="flex justify-center mb-6">
            <Image
              src="/images/logo.png"
              alt="Navi Medical"
              width={240}
              height={90}
              className="w-full max-w-[200px] sm:max-w-[240px] h-auto"
              priority
            />
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-700">
              スタッフ用画面
            </h1>
            {step !== 'auth' && (
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                ログアウト
              </button>
            )}
          </div>
          {step === 'auth' && (
            <p className="text-sm text-gray-500 text-center mt-2">
              お客様のQRコードを読み取ってチケットを消込します
            </p>
          )}
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
          {renderContent()}
        </div>
      </div>
    </main>
  )
}
