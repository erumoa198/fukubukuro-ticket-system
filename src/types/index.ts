// チケットセットの種類
export type SetType = 'artmake_repeater' | 'artmake_new' | 'esthe_basic' | 'esthe_reward'

// チケットタイプ
export type TicketType = 'A' | 'B' | 'C' | 'D' | 'E'

// チケットセット
export interface TicketSet {
  id: string
  set_type: SetType
  customer_note: string | null
  created_at: string
  expires_at: string
}

// 個別チケット
export interface Ticket {
  id: string
  set_id: string
  ticket_type: TicketType
  ticket_name: string
  ticket_description: string | null
  is_used: boolean
  used_at: string | null
  used_by: string | null
  used_menu: string | null
  created_at: string
}

// スタッフ
export interface Staff {
  id: number
  name: string
  pin: string
  is_active: boolean
  created_at: string
}

// セット名の日本語マッピング
export const SET_TYPE_NAMES: Record<SetType, string> = {
  artmake_repeater: 'アートメイク リピーター様セット',
  artmake_new: 'アートメイク ご新規様セット',
  esthe_basic: 'エステ 肌底上げセット',
  esthe_reward: 'エステ ご褒美セット',
}

// チケットタイプ別のメニュー選択肢
export const TICKET_MENUS: Record<TicketType, string[]> = {
  A: [], // 施術チケット - 選択不要
  B: [], // 物販割引 - 選択不要
  C: [], // 施術チケット - 選択不要
  D: [], // 施術無料券 - 選択不要
  E: ['セラフォーム', 'エニシーグローパックCL3包'], // 選べる美肌アイテム - 複数選択可
}

// チケットセットとチケットの結合型
export interface TicketSetWithTickets extends TicketSet {
  tickets: Ticket[]
}
