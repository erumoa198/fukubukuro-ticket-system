'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@/lib/supabase'
import { TicketSet, Ticket, Staff, SET_TYPE_NAMES, SetType } from '@/types'
import {
  isDemoMode,
  getDemoTicketSets,
  getDemoTickets,
  getAllDemoStaff,
  addDemoStaff,
  updateDemoStaff,
  deleteDemoStaff,
  addDemoTicketSet,
} from '@/lib/demo-data'

type AdminStep = 'auth' | 'dashboard'
type TabType = 'tickets' | 'staff'

interface TicketSetWithTickets extends TicketSet {
  tickets: Ticket[]
}

export default function AdminPage() {
  const [step, setStep] = useState<AdminStep>('auth')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [ticketSets, setTicketSets] = useState<TicketSetWithTickets[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSet, setSelectedSet] = useState<TicketSetWithTickets | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createType, setCreateType] = useState<SetType>('artmake_repeater')
  const [customerNote, setCustomerNote] = useState('')
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('tickets')

  // スタッフ管理用state
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [staffName, setStaffName] = useState('')
  const [staffPin, setStaffPin] = useState('')
  const [staffActive, setStaffActive] = useState(true)
  const [savingStaff, setSavingStaff] = useState(false)

  // チケット発行後QR表示用
  const [newlyCreatedSet, setNewlyCreatedSet] = useState<TicketSetWithTickets | null>(null)

  // チケットセット編集・削除用
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showEditSetModal, setShowEditSetModal] = useState(false)
  const [editingSet, setEditingSet] = useState<TicketSetWithTickets | null>(null)
  const [editCustomerNote, setEditCustomerNote] = useState('')
  const [savingSet, setSavingSet] = useState(false)

  // チケットセット一覧取得
  const fetchTicketSets = async () => {
    setLoading(true)
    try {
      if (isDemoMode) {
        // デモモード: ダミーデータを使用
        const demoSets = getDemoTicketSets()
        const setsWithTickets = demoSets.map(set => ({
          ...set,
          tickets: getDemoTickets(set.id)
        }))
        setTicketSets(setsWithTickets)
      } else {
        // 本番モード: Supabaseから取得
        const { data: sets } = await supabase
          .from('ticket_sets')
          .select('*')
          .order('created_at', { ascending: false })

        if (sets) {
          const setsWithTickets = await Promise.all(
            sets.map(async (set) => {
              const { data: tickets } = await supabase
                .from('tickets')
                .select('*')
                .eq('set_id', set.id)
                .order('created_at', { ascending: true })

              return { ...set, tickets: tickets || [] }
            })
          )
          setTicketSets(setsWithTickets)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // スタッフ一覧取得
  const fetchStaff = async () => {
    try {
      if (isDemoMode) {
        // デモモード: ダミーデータを使用
        setStaffList(getAllDemoStaff())
      } else {
        // 本番モード: Supabaseから取得
        const { data } = await supabase
          .from('staff')
          .select('*')
          .order('created_at', { ascending: true })

        if (data) {
          setStaffList(data)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  // パスワード認証
  const handleAuth = () => {
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'fukubukuro2025'
    if (password === correctPassword) {
      setStep('dashboard')
      fetchTicketSets()
      fetchStaff()
    } else {
      setPasswordError(true)
    }
  }

  // 新規チケットセット作成
  const handleCreate = async () => {
    setCreating(true)
    try {
      if (isDemoMode) {
        // デモモード: メモリ上にデータを追加
        const tickets = getTicketsForSetType(createType, '')
        const newSet = addDemoTicketSet(
          createType,
          customerNote || null,
          tickets.map(t => ({
            ticket_type: t.ticket_type as 'A' | 'B' | 'C' | 'D' | 'E',
            ticket_name: t.ticket_name,
            ticket_description: t.ticket_description,
            is_used: false,
            used_at: null,
            used_by: null,
            used_menu: null,
          }))
        )

        await fetchTicketSets()

        const createdSetWithTickets = {
          ...newSet,
          tickets: getDemoTickets(newSet.id)
        }

        setShowCreateModal(false)
        setCustomerNote('')
        setNewlyCreatedSet(createdSetWithTickets)
      } else {
        // 本番モード: Supabaseに保存
        const { data: newSet, error: setError } = await supabase
          .from('ticket_sets')
          .insert({
            set_type: createType,
            customer_note: customerNote || null,
            expires_at: '2026-12-31T23:59:59Z' // 2026年末まで有効
          })
          .select()
          .single()

        if (setError) throw setError
        if (!newSet) throw new Error('チケットセットの作成に失敗しました')

        const tickets = getTicketsForSetType(createType, newSet.id)

        const { error: ticketError } = await supabase
          .from('tickets')
          .insert(tickets)

        if (ticketError) throw ticketError

        await fetchTicketSets()

        const { data: newTickets } = await supabase
          .from('tickets')
          .select('*')
          .eq('set_id', newSet.id)
          .order('created_at', { ascending: true })

        const createdSetWithTickets = {
          ...newSet,
          tickets: newTickets || []
        }

        setShowCreateModal(false)
        setCustomerNote('')
        setNewlyCreatedSet(createdSetWithTickets)
      }
    } catch (err) {
      console.error(err)
      alert('作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  // セットタイプに応じたチケット定義
  const getTicketsForSetType = (type: SetType, setId: string) => {
    switch (type) {
      case 'artmake_repeater':
        return [
          { set_id: setId, ticket_type: 'A', ticket_name: '施術チケット', ticket_description: 'アートメイク施術1回' },
          { set_id: setId, ticket_type: 'B', ticket_name: '物販10%割引チケット', ticket_description: '物販商品10%OFF' },
        ]
      case 'artmake_new':
        return [
          { set_id: setId, ticket_type: 'A', ticket_name: '施術チケット（1回目）', ticket_description: 'アートメイク施術1回' },
          { set_id: setId, ticket_type: 'A', ticket_name: '施術チケット（2回目）', ticket_description: 'アートメイク施術1回' },
        ]
      case 'esthe_basic':
        return [
          { set_id: setId, ticket_type: 'D', ticket_name: '施術1メニュー無料券', ticket_description: 'エステ施術1メニュー無料' },
          { set_id: setId, ticket_type: 'E', ticket_name: '選べる美肌アイテム引換券', ticket_description: '美容アイテム1点と交換' },
          { set_id: setId, ticket_type: 'B', ticket_name: '物販10%割引チケット', ticket_description: '物販商品10%OFF' },
        ]
      case 'esthe_reward':
        return [
          { set_id: setId, ticket_type: 'D', ticket_name: '施術1メニュー無料券①', ticket_description: 'エステ施術1メニュー無料' },
          { set_id: setId, ticket_type: 'D', ticket_name: '施術1メニュー無料券②', ticket_description: 'エステ施術1メニュー無料' },
          { set_id: setId, ticket_type: 'E', ticket_name: '選べる美肌アイテム引換券', ticket_description: '美容アイテム1点と交換' },
          { set_id: setId, ticket_type: 'B', ticket_name: '物販10%割引チケット', ticket_description: '物販商品10%OFF' },
        ]
      default:
        return []
    }
  }

  // URLコピー
  const copyUrl = async (setId: string) => {
    const url = `${window.location.origin}/ticket/${setId}`
    await navigator.clipboard.writeText(url)
    alert('URLをコピーしました')
  }

  // チケットセット編集モーダルを開く
  const openEditSetModal = (set: TicketSetWithTickets) => {
    setEditingSet(set)
    setEditCustomerNote(set.customer_note || '')
    setShowEditSetModal(true)
    setOpenMenuId(null)
  }

  // チケットセット保存
  const handleSaveSet = async () => {
    if (!editingSet) return

    setSavingSet(true)
    try {
      if (isDemoMode) {
        // デモモードでは対応しない
        alert('デモモードでは編集できません')
      } else {
        const { error } = await supabase
          .from('ticket_sets')
          .update({ customer_note: editCustomerNote || null })
          .eq('id', editingSet.id)

        if (error) throw error
      }

      await fetchTicketSets()
      setShowEditSetModal(false)
      setEditingSet(null)
      alert('チケットセットを更新しました')
    } catch (err) {
      console.error('チケットセット保存エラー:', err)
      alert('保存に失敗しました')
    } finally {
      setSavingSet(false)
    }
  }

  // チケットセット削除
  const handleDeleteSet = async (set: TicketSetWithTickets) => {
    const usedCount = set.tickets.filter(t => t.is_used).length
    const confirmMessage = usedCount > 0
      ? `このチケットセットには使用済みチケットが${usedCount}枚あります。\n本当に削除しますか？この操作は取り消せません。`
      : `「${SET_TYPE_NAMES[set.set_type]}」を削除しますか？\nこの操作は取り消せません。`

    if (!confirm(confirmMessage)) return

    setOpenMenuId(null)
    try {
      if (isDemoMode) {
        alert('デモモードでは削除できません')
        return
      }

      // まずチケットを削除
      const { error: ticketError } = await supabase
        .from('tickets')
        .delete()
        .eq('set_id', set.id)

      if (ticketError) throw ticketError

      // 次にチケットセットを削除
      const { error: setError } = await supabase
        .from('ticket_sets')
        .delete()
        .eq('id', set.id)

      if (setError) throw setError

      await fetchTicketSets()
      alert('チケットセットを削除しました')
    } catch (err) {
      console.error('チケットセット削除エラー:', err)
      alert('削除に失敗しました')
    }
  }

  // チケット使用取消
  const handleRevertTicket = async (ticket: Ticket) => {
    if (!confirm(`「${ticket.ticket_name}」の使用を取り消しますか？`)) return

    try {
      if (isDemoMode) {
        alert('デモモードでは取消できません')
        return
      }

      const { error } = await supabase
        .from('tickets')
        .update({
          is_used: false,
          used_at: null,
          used_by: null,
          used_menu: null
        })
        .eq('id', ticket.id)

      if (error) throw error

      await fetchTicketSets()
      alert('チケットの使用を取り消しました')
    } catch (err) {
      console.error('チケット使用取消エラー:', err)
      alert('取消に失敗しました')
    }
  }

  // スタッフモーダルを開く
  const openStaffModal = (staff?: Staff) => {
    if (staff) {
      setEditingStaff(staff)
      setStaffName(staff.name)
      setStaffPin(staff.pin)
      setStaffActive(staff.is_active)
    } else {
      setEditingStaff(null)
      setStaffName('')
      setStaffPin('')
      setStaffActive(true)
    }
    setShowStaffModal(true)
  }

  // スタッフ保存
  const handleSaveStaff = async () => {
    if (!staffName.trim()) {
      alert('スタッフ名を入力してください')
      return
    }
    if (!staffPin.trim() || staffPin.length < 4) {
      alert('4桁以上のPINを入力してください')
      return
    }

    setSavingStaff(true)
    try {
      if (isDemoMode) {
        // デモモード: メモリ上のデータを更新
        if (editingStaff) {
          updateDemoStaff(editingStaff.id, {
            name: staffName.trim(),
            pin: staffPin.trim(),
            is_active: staffActive
          })
        } else {
          addDemoStaff({
            name: staffName.trim(),
            pin: staffPin.trim(),
            is_active: staffActive
          })
        }
      } else {
        // 本番モード: Supabaseを更新
        if (editingStaff) {
          const { error } = await supabase
            .from('staff')
            .update({
              name: staffName.trim(),
              pin: staffPin.trim(),
              is_active: staffActive
            })
            .eq('id', editingStaff.id)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('staff')
            .insert({
              name: staffName.trim(),
              pin: staffPin.trim(),
              is_active: staffActive
            })

          if (error) throw error
        }
      }

      await fetchStaff()
      setShowStaffModal(false)
      alert(editingStaff ? 'スタッフ情報を更新しました' : 'スタッフを追加しました')
    } catch (err) {
      console.error('スタッフ保存エラー:', err)
      alert('保存に失敗しました')
    } finally {
      setSavingStaff(false)
    }
  }

  // スタッフ削除
  const handleDeleteStaff = async (staff: Staff) => {
    if (!confirm(`${staff.name} を削除しますか？`)) return

    try {
      if (isDemoMode) {
        // デモモード: メモリ上のデータを削除
        deleteDemoStaff(staff.id)
      } else {
        // 本番モード: Supabaseから削除
        const { error } = await supabase
          .from('staff')
          .delete()
          .eq('id', staff.id)

        if (error) throw error
      }

      await fetchStaff()
      alert('スタッフを削除しました')
    } catch (err) {
      console.error(err)
      alert('削除に失敗しました')
    }
  }

  // ログアウト
  const handleLogout = () => {
    setStep('auth')
    setPassword('')
    setTicketSets([])
    setStaffList([])
  }

  if (step === 'auth') {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          {/* トップへ戻る */}
          <a href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            トップへ戻る
          </a>
          <h1 className="text-xl font-semibold text-center mb-2">管理画面</h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            チケット発行・スタッフ管理を行います
          </p>
          <input
            type="password"
            placeholder="パスワードを入力"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 mb-4"
          />
          {passwordError && (
            <p className="text-red-500 text-sm mb-4">パスワードが正しくありません</p>
          )}
          <button onClick={handleAuth} className="btn-gold w-full">
            ログイン
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* トップへ戻る */}
        <a href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          トップへ戻る
        </a>

        {/* デモモードバナー */}
        {isDemoMode && (
          <div className="mb-4 p-3 bg-amber-100 border border-amber-300 rounded-lg text-center">
            <p className="text-sm text-amber-800">
              🔧 <strong>デモモード</strong>: Supabase未接続。データはブラウザ更新で消えます
            </p>
          </div>
        )}

        <header className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold">管理画面</h1>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              ログアウト
            </button>
          </div>

          {/* 説明テキスト */}
          <p className="text-sm text-gray-500 mb-4">
            チケットの発行・管理、スタッフの登録を行えます
          </p>

          <div className="flex items-center justify-between mb-2">
            <div></div>
            <div className="flex gap-2">
              {activeTab === 'tickets' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-gold"
                >
                  + 新規発行
                </button>
              )}
              {activeTab === 'staff' && (
                <button
                  onClick={() => openStaffModal()}
                  className="btn-gold"
                >
                  + スタッフ追加
                </button>
              )}
            </div>
          </div>
          {/* ボタン下の補足説明 */}
          {activeTab === 'tickets' && (
            <p className="text-xs text-gray-400 text-right mb-4">
              新規発行で福袋チケットセットを作成し、QRコードをお客様にお渡しください
            </p>
          )}
          {activeTab === 'staff' && (
            <p className="text-xs text-gray-400 text-right mb-4">
              スタッフを登録すると、チケット使用時の対応者として記録されます
            </p>
          )}

          {/* タブ切り替え */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'tickets'
                  ? 'bg-gold-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              チケット管理
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'staff'
                  ? 'bg-gold-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              スタッフ管理
            </button>
          </div>
        </header>

        {/* チケット管理タブ */}
        {activeTab === 'tickets' && (
          <>
            {/* 統計 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <div className="bg-white rounded-xl p-4 shadow">
                <p className="text-sm text-gray-500">総セット数</p>
                <p className="text-2xl font-bold text-gray-800">{ticketSets.length}</p>
                <p className="text-xs text-gray-400 mt-1">発行済み福袋</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow">
                <p className="text-sm text-gray-500">総チケット数</p>
                <p className="text-2xl font-bold text-gray-800">
                  {ticketSets.reduce((sum, s) => sum + s.tickets.length, 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">全チケット枚数</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow">
                <p className="text-sm text-gray-500">使用済み</p>
                <p className="text-2xl font-bold text-green-600">
                  {ticketSets.reduce((sum, s) => sum + s.tickets.filter(t => t.is_used).length, 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">消化済みチケット</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow">
                <p className="text-sm text-gray-500">未使用</p>
                <p className="text-2xl font-bold text-gold-600">
                  {ticketSets.reduce((sum, s) => sum + s.tickets.filter(t => !t.is_used).length, 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">利用可能チケット</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              ※ 統計はリアルタイムで更新されます。チケット使用状況の確認にご活用ください。
            </p>

            {/* チケットセット一覧 */}
            <div className="bg-white rounded-xl shadow">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold">チケットセット一覧</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">読み込み中...</div>
          ) : ticketSets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              チケットセットがありません
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {ticketSets.map((set) => {
                const usedCount = set.tickets.filter(t => t.is_used).length
                const totalCount = set.tickets.length

                return (
                  <div key={set.id} className="p-4 hover:bg-gray-50 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{SET_TYPE_NAMES[set.set_type]}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            usedCount === totalCount
                              ? 'bg-gray-200 text-gray-600'
                              : 'bg-gold-100 text-gold-700'
                          }`}>
                            {usedCount}/{totalCount} 使用済
                          </span>
                        </div>
                        {set.customer_note && (
                          <p className="text-sm text-gray-500 mb-1">{set.customer_note}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          作成: {new Date(set.created_at).toLocaleDateString('ja-JP')}
                          &nbsp;|&nbsp;ID: {set.id.slice(0, 8)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedSet(set)}
                          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          QR表示
                        </button>
                        <button
                          onClick={() => copyUrl(set.id)}
                          className="px-3 py-1.5 text-sm bg-gold-100 text-gold-700 hover:bg-gold-200 rounded-lg transition-colors"
                        >
                          URLコピー
                        </button>
                        {/* メニューボタン */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === set.id ? null : set.id)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="5" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="12" cy="19" r="2" />
                            </svg>
                          </button>
                          {/* ドロップダウンメニュー */}
                          {openMenuId === set.id && (
                            <>
                              {/* オーバーレイ（メニュー外クリックで閉じる） */}
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={() => openEditSetModal(set)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  編集
                                </button>
                                <button
                                  onClick={() => handleDeleteSet(set)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  削除
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* チケット詳細 */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {set.tickets.map((ticket) => (
                        <span
                          key={ticket.id}
                          onClick={() => ticket.is_used && handleRevertTicket(ticket)}
                          className={`text-xs px-2 py-1 rounded ${
                            ticket.is_used
                              ? 'bg-gray-100 text-gray-400 line-through cursor-pointer hover:bg-gray-200'
                              : 'bg-green-50 text-green-700'
                          }`}
                          title={ticket.is_used ? 'クリックで使用取消' : ''}
                        >
                          {ticket.ticket_name}
                          {ticket.is_used && ticket.used_at && (
                            <span className="ml-1">
                              ({new Date(ticket.used_at).toLocaleDateString('ja-JP')})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
            </div>
          </>
        )}

        {/* スタッフ管理タブ */}
        {activeTab === 'staff' && (
          <div className="bg-white rounded-xl shadow">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold">スタッフ一覧</h2>
            </div>

            {staffList.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                スタッフが登録されていません
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {staffList.map((staff) => (
                  <div key={staff.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        staff.is_active ? 'bg-gold-500' : 'bg-gray-400'
                      }`}>
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-sm text-gray-400">
                          PIN: {staff.pin}
                          {!staff.is_active && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">無効</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openStaffModal(staff)}
                        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staff)}
                        className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QRコードモーダル */}
        {selectedSet && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-center mb-4">
                {SET_TYPE_NAMES[selectedSet.set_type]}
              </h3>
              {selectedSet.customer_note && (
                <p className="text-sm text-gray-500 text-center mb-4">{selectedSet.customer_note}</p>
              )}
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-xl shadow-inner">
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/ticket/${selectedSet.id}`}
                    size={200}
                    level="M"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mb-4 break-all">
                {typeof window !== 'undefined' && `${window.location.origin}/ticket/${selectedSet.id}`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => copyUrl(selectedSet.id)}
                  className="flex-1 py-2 bg-gold-100 text-gold-700 rounded-lg hover:bg-gold-200 transition-colors"
                >
                  URLコピー
                </button>
                <button
                  onClick={() => setSelectedSet(null)}
                  className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 新規作成モーダル */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-center mb-4">
                新規チケットセット発行
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  セットタイプ
                </label>
                <select
                  value={createType}
                  onChange={(e) => setCreateType(e.target.value as SetType)}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                >
                  <option value="artmake_repeater">アートメイク リピーター様セット</option>
                  <option value="artmake_new">アートメイク ご新規様セット</option>
                  <option value="esthe_basic">エステ 肌底上げセット</option>
                  <option value="esthe_reward">エステ ご褒美セット</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  購入者メモ（任意）
                </label>
                <input
                  type="text"
                  placeholder="例: 山田花子様"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 btn-gold disabled:opacity-50"
                >
                  {creating ? '作成中...' : '発行する'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* スタッフ追加/編集モーダル */}
        {showStaffModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-center mb-4">
                {editingStaff ? 'スタッフ編集' : '新規スタッフ追加'}
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  スタッフ名
                </label>
                <input
                  type="text"
                  placeholder="例: 山田花子"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN（4桁以上）
                </label>
                <input
                  type="text"
                  placeholder="例: 1234"
                  value={staffPin}
                  onChange={(e) => setStaffPin(e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                  maxLength={8}
                />
                <p className="text-xs text-gray-400 mt-1">
                  スタッフ画面ログイン時に使用します。覚えやすい4桁以上の数字を設定してください。
                </p>
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={staffActive}
                    onChange={(e) => setStaffActive(e.target.checked)}
                    className="w-5 h-5 text-gold-500 rounded focus:ring-gold-400"
                  />
                  <span className="text-sm text-gray-700">有効（ログイン可能）</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowStaffModal(false)}
                  className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveStaff}
                  disabled={savingStaff}
                  className="flex-1 btn-gold disabled:opacity-50"
                >
                  {savingStaff ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* チケットセット編集モーダル */}
        {showEditSetModal && editingSet && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-center mb-4">
                チケットセット編集
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  セットタイプ
                </label>
                <p className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600">
                  {SET_TYPE_NAMES[editingSet.set_type]}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  セットタイプは変更できません
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  購入者メモ
                </label>
                <input
                  type="text"
                  placeholder="例: 山田花子様"
                  value={editCustomerNote}
                  onChange={(e) => setEditCustomerNote(e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowEditSetModal(false)
                    setEditingSet(null)
                  }}
                  className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveSet}
                  disabled={savingSet}
                  className="flex-1 btn-gold disabled:opacity-50"
                >
                  {savingSet ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 新規作成完了モーダル（QR即表示） */}
        {newlyCreatedSet && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">チケット発行完了</h3>
              </div>

              <p className="text-sm text-gray-600 text-center mb-2">
                {SET_TYPE_NAMES[newlyCreatedSet.set_type]}
              </p>
              {newlyCreatedSet.customer_note && (
                <p className="text-sm text-gray-500 text-center mb-4">{newlyCreatedSet.customer_note}</p>
              )}

              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-xl shadow-inner border">
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/ticket/${newlyCreatedSet.id}`}
                    size={180}
                    level="M"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center mb-4 break-all">
                {typeof window !== 'undefined' && `${window.location.origin}/ticket/${newlyCreatedSet.id}`}
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => copyUrl(newlyCreatedSet.id)}
                  className="w-full py-2 bg-gold-100 text-gold-700 rounded-lg hover:bg-gold-200 transition-colors font-medium"
                >
                  URLをコピー
                </button>
                <button
                  onClick={() => setNewlyCreatedSet(null)}
                  className="w-full py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
