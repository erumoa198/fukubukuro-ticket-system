import TicketPageClient from '../ticket/[id]/TicketPageClient'

// チケット表示用テンプレートページ
// /ticket/:id へのアクセスを、このページにリダイレクト（200 rewrite）
// クライアントサイドでURLからIDを取得し、Supabaseからデータを取得
// ※ _で始まるフォルダはNext.jsで除外されるため ticket-view を使用

export default function TicketViewPage() {
  return <TicketPageClient id="template" />
}
