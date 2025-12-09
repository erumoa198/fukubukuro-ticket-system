# 福袋電子チケットシステム

美容クリニック向け福袋電子チケット管理システム

## 機能

### ユーザー向け（/ticket/[id]）
- チケット一覧の確認（未使用/使用済み）
- QRコード表示（来院時にスタッフに提示）
- URLシェア機能（友人への譲渡）
- リアルタイムで使用状況が反映

### スタッフ向け（/staff）
- PIN認証
- QRコードスキャン
- チケット選択・メニュー選択
- ワンタップ消込

### 管理画面（/admin）
- パスワード認証
- 新規チケットセット発行
- 全チケット一覧・状態確認
- QRコード/URL生成

## セットアップ手順

### 1. Supabaseプロジェクト作成

1. [Supabase](https://supabase.com) でアカウント作成・ログイン
2. 「New Project」でプロジェクト作成
3. SQL Editorで `supabase-schema.sql` の内容を実行
4. Settings > API からキーを取得

### 2. 環境変数設定

`.env.local.example` を `.env.local` にコピーして編集：

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 認証用（任意で変更）
NEXT_PUBLIC_ADMIN_PASSWORD=fukubukuro2025
NEXT_PUBLIC_STAFF_PIN=1234
```

### 3. 依存関係インストール

```bash
npm install
```

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

### 5. Vercelデプロイ

1. GitHubにリポジトリをプッシュ
2. [Vercel](https://vercel.com) でインポート
3. 環境変数を設定
4. デプロイ

## 福袋セット構成

| セット名 | チケット内容 |
|---------|-------------|
| アートメイク リピーター | 施術チケット×1、物販10%OFF×1 |
| アートメイク ご新規 | 施術2回チケット×1 |
| エステ 肌底上げ | 施術無料券×1、美肌アイテム×1、物販10%OFF×1 |
| エステ ご褒美 | 施術無料券×2、美肌アイテム×1、物販10%OFF×1 |

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS 4
- **データベース**: Supabase (PostgreSQL)
- **ホスティング**: Vercel
- **QRコード生成**: qrcode.react
- **QRスキャン**: html5-qrcode

## ディレクトリ構造

```
fukubukuro-ticket-system/
├── src/
│   ├── app/
│   │   ├── page.tsx          # トップページ
│   │   ├── layout.tsx        # 共通レイアウト
│   │   ├── globals.css       # グローバルスタイル
│   │   ├── ticket/
│   │   │   └── [id]/
│   │   │       └── page.tsx  # ユーザー用チケット画面
│   │   ├── staff/
│   │   │   └── page.tsx      # スタッフ用消込画面
│   │   └── admin/
│   │       └── page.tsx      # 管理画面
│   ├── components/
│   │   └── QRScanner.tsx     # QRスキャナーコンポーネント
│   ├── lib/
│   │   └── supabase.ts       # Supabaseクライアント
│   └── types/
│       └── index.ts          # 型定義
├── supabase-schema.sql       # DB初期化SQL
├── .env.local.example        # 環境変数サンプル
└── package.json
```

## セキュリティ

- 管理画面: パスワード認証
- スタッフ画面: PINコード認証
- ユーザー画面: UUID（推測困難）による保護
- Supabase RLS: 読み取りは全員可、更新はService Roleのみ

## カスタマイズ

### スタッフ名の変更
Supabaseの `staff` テーブルを編集

### パスワード変更
1. `.env.local` の `NEXT_PUBLIC_ADMIN_PASSWORD` / `NEXT_PUBLIC_STAFF_PIN` を変更
2. または Supabase の `admin_settings` テーブルを編集

### メニュー選択肢の変更
`src/types/index.ts` の `TICKET_MENUS` を編集

### デザインカスタマイズ
`src/app/globals.css` と `tailwind.config.ts` を編集

## トラブルシューティング

### QRスキャンができない
- HTTPSで接続しているか確認（localhost以外はHTTPS必須）
- カメラ権限を許可

### チケットが表示されない
- Supabaseの接続情報を確認
- RLSポリシーが正しく設定されているか確認

### 環境変数が反映されない
- `.env.local` ファイル名が正しいか確認
- サーバーを再起動
