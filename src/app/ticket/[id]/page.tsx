import TicketPageClient from './TicketPageClient'

// 静的エクスポート用：プレースホルダーIDでビルド
// これにより /ticket/[id]/ フォルダが生成され、Cloudflare Pagesのリダイレクトで動作
export function generateStaticParams() {
  return [{ id: 'placeholder' }]
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TicketPageClient id={id} />
}
