import TicketPageClient from '../ticket/[id]/TicketPageClient'

// テンプレートページ - /ticket/* へのリダイレクトターゲット
// このページは /_ticket-template/ に配置され、/ticket/:id からリダイレクトされる
// Cloudflare Pagesの無限ループ検出を回避するため、/ticket/ パス外に配置

export default function TicketTemplatePage() {
  return <TicketPageClient id="template" />
}
