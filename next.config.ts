import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages対応：静的エクスポート
  output: 'export',
  // 画像最適化を無効化（静的エクスポート時に必要）
  images: {
    unoptimized: true,
  },
  // 動的ルートのトレーリングスラッシュ
  trailingSlash: true,
}

export default nextConfig
