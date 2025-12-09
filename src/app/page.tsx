import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-rose-gold-50 to-white">
      <div className="text-center animate-fade-in max-w-md">
        {/* ロゴエリア */}
        <div className="flex justify-center mb-2">
          <Image
            src="/images/logo.png"
            alt="Navi Medical"
            width={280}
            height={175}
            className="w-full max-w-[240px] sm:max-w-[280px] h-auto"
            priority
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-gray-800 mb-2">
          福袋チケットシステム
        </h1>
        <p className="text-gray-500 mb-8">
          美容クリニック電子チケット管理
        </p>

        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          {/* スタッフログイン */}
          <Link
            href="/staff"
            className="btn-gold text-center"
          >
            スタッフログイン
          </Link>

          {/* 管理画面 */}
          <Link
            href="/admin"
            className="bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors text-center"
          >
            管理画面
          </Link>
        </div>

        {/* 区切り線 */}
        <div className="section-divider my-8" />

        {/* ユーザー向け説明 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            お客様へ
          </h2>
          <p className="text-xs text-gray-500">
            チケットは購入時にお渡ししたURL（QRコード）からご確認いただけます。
            <br />
            ご来院時にスタッフにQRコードをお見せください。
          </p>
        </div>

        {/* フッター */}
        <footer className="mt-8 text-xs text-gray-400">
          <p>© 2025 Beauty Clinic</p>
        </footer>
      </div>
    </main>
  )
}
