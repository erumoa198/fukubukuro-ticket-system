'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const startScanner = async () => {
    if (!containerRef.current || scannerRef.current) return

    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QRコードを読み取ったら
          onScan(decodedText)
          stopScanner()
        },
        () => {
          // スキャン中のエラー（無視）
        }
      )

      setIsScanning(true)
      setHasPermission(true)
    } catch (err) {
      setHasPermission(false)
      onError?.('カメラへのアクセスが拒否されました')
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch {
        // 既に停止している場合は無視
      }
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  return (
    <div className="w-full">
      <div
        id="qr-reader"
        ref={containerRef}
        className="w-full max-w-sm mx-auto rounded-xl overflow-hidden bg-gray-100"
        style={{ minHeight: isScanning ? '300px' : '0' }}
      />

      {!isScanning && (
        <button
          onClick={startScanner}
          className="w-full btn-gold mt-4"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            QRコードをスキャン
          </span>
        </button>
      )}

      {isScanning && (
        <button
          onClick={stopScanner}
          className="w-full mt-4 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          スキャンを停止
        </button>
      )}

      {hasPermission === false && (
        <p className="text-red-500 text-sm text-center mt-4">
          カメラへのアクセスを許可してください
        </p>
      )}
    </div>
  )
}
