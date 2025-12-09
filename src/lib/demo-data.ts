// デモモード用のダミーデータ
import { Staff, TicketSet, Ticket } from '@/types'

// Supabaseが接続されていない場合はデモモード
export const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL

// デモ用スタッフデータ
export const demoStaff: Staff[] = [
  { id: 1, name: '山田花子', pin: '1111', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 2, name: '佐藤美咲', pin: '2222', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 3, name: '鈴木愛', pin: '3333', is_active: true, created_at: '2025-01-01T00:00:00Z' },
]

// デモ用チケットセット（有効期限は2026年末まで延長）
export const demoTicketSets: TicketSet[] = [
  {
    id: 'demo-set-001',
    set_type: 'artmake_repeater',
    customer_note: '田中様',
    created_at: '2025-01-15T10:00:00Z',
    expires_at: '2026-12-31T23:59:59Z',
  },
  {
    id: 'demo-set-002',
    set_type: 'esthe_basic',
    customer_note: '高橋様',
    created_at: '2025-01-16T14:30:00Z',
    expires_at: '2026-12-31T23:59:59Z',
  },
  {
    id: 'demo-set-003',
    set_type: 'artmake_new',
    customer_note: null,
    created_at: '2025-01-17T09:00:00Z',
    expires_at: '2026-12-31T23:59:59Z',
  },
]

// デモ用チケット
export const demoTickets: Ticket[] = [
  // demo-set-001 のチケット（アートメイク リピーター様セット）
  {
    id: 'ticket-001-a',
    set_id: 'demo-set-001',
    ticket_type: 'A',
    ticket_name: '施術チケット',
    ticket_description: 'アートメイク施術1回',
    is_used: false,
    used_at: null,
    used_by: null,
    used_menu: null,
    created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 'ticket-001-b',
    set_id: 'demo-set-001',
    ticket_type: 'B',
    ticket_name: '物販10%割引チケット',
    ticket_description: '物販商品10%OFF',
    is_used: true,
    used_at: '2025-01-20T15:30:00Z',
    used_by: '山田花子',
    used_menu: null,
    created_at: '2025-01-15T10:00:00Z',
  },
  // demo-set-002 のチケット（エステ 肌底上げセット）
  {
    id: 'ticket-002-d',
    set_id: 'demo-set-002',
    ticket_type: 'D',
    ticket_name: '施術1メニュー無料券',
    ticket_description: 'エステ施術1メニュー無料',
    is_used: false,
    used_at: null,
    used_by: null,
    used_menu: null,
    created_at: '2025-01-16T14:30:00Z',
  },
  {
    id: 'ticket-002-e',
    set_id: 'demo-set-002',
    ticket_type: 'E',
    ticket_name: '選べる美肌アイテム引換券',
    ticket_description: '美容アイテム1点と交換',
    is_used: false,
    used_at: null,
    used_by: null,
    used_menu: null,
    created_at: '2025-01-16T14:30:00Z',
  },
  {
    id: 'ticket-002-b',
    set_id: 'demo-set-002',
    ticket_type: 'B',
    ticket_name: '物販10%割引チケット',
    ticket_description: '物販商品10%OFF',
    is_used: false,
    used_at: null,
    used_by: null,
    used_menu: null,
    created_at: '2025-01-16T14:30:00Z',
  },
  // demo-set-003 のチケット（アートメイク ご新規様セット）- 施術チケット1枚×2
  {
    id: 'ticket-003-a1',
    set_id: 'demo-set-003',
    ticket_type: 'A',
    ticket_name: '施術チケット（1回目）',
    ticket_description: 'アートメイク施術1回',
    is_used: false,
    used_at: null,
    used_by: null,
    used_menu: null,
    created_at: '2025-01-17T09:00:00Z',
  },
  {
    id: 'ticket-003-a2',
    set_id: 'demo-set-003',
    ticket_type: 'A',
    ticket_name: '施術チケット（2回目）',
    ticket_description: 'アートメイク施術1回',
    is_used: false,
    used_at: null,
    used_by: null,
    used_menu: null,
    created_at: '2025-01-17T09:00:00Z',
  },
]

// デモデータの状態管理（メモリ上で更新可能）
let _demoStaff = [...demoStaff]
let _demoTicketSets = [...demoTicketSets]
let _demoTickets = [...demoTickets]

export const getDemoStaff = () => _demoStaff.filter(s => s.is_active)
export const getAllDemoStaff = () => _demoStaff
export const getDemoTicketSets = () => _demoTicketSets
export const getDemoTickets = (setId?: string) =>
  setId ? _demoTickets.filter(t => t.set_id === setId) : _demoTickets

export const getDemoTicketSet = (setId: string) =>
  _demoTicketSets.find(s => s.id === setId)

// デモデータの更新関数
export const updateDemoTicket = (ticketId: string, updates: Partial<Ticket>) => {
  _demoTickets = _demoTickets.map(t =>
    t.id === ticketId ? { ...t, ...updates } : t
  )
}

export const addDemoStaff = (staff: Omit<Staff, 'id' | 'created_at'>) => {
  const newStaff: Staff = {
    ...staff,
    id: Math.max(..._demoStaff.map(s => s.id)) + 1,
    created_at: new Date().toISOString(),
  }
  _demoStaff.push(newStaff)
  return newStaff
}

export const updateDemoStaff = (staffId: number, updates: Partial<Staff>) => {
  _demoStaff = _demoStaff.map(s =>
    s.id === staffId ? { ...s, ...updates } : s
  )
}

export const deleteDemoStaff = (staffId: number) => {
  _demoStaff = _demoStaff.filter(s => s.id !== staffId)
}

export const addDemoTicketSet = (
  setType: TicketSet['set_type'],
  customerNote: string | null,
  tickets: Omit<Ticket, 'id' | 'set_id' | 'created_at'>[]
) => {
  const setId = `demo-set-${Date.now()}`
  const newSet: TicketSet = {
    id: setId,
    set_type: setType,
    customer_note: customerNote,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年後
  }
  _demoTicketSets.unshift(newSet)

  tickets.forEach((ticket, index) => {
    const newTicket: Ticket = {
      ...ticket,
      id: `${setId}-ticket-${index}`,
      set_id: setId,
      created_at: new Date().toISOString(),
    }
    _demoTickets.push(newTicket)
  })

  return newSet
}
