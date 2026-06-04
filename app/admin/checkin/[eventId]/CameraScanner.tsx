'use client'

import { useEffect, useRef } from 'react'

export default function CameraScanner({ onScan }: { onScan: (text: string) => void }) {
  const mountedRef = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any = null

    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      scanner = new Html5QrcodeScanner(
        'qr-camera-reader',
        { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
        false
      )
      scannerRef.current = scanner
      scanner.render(
        (text: string) => {
          onScan(text)
          // 스캔 후 잠깐 멈춤 방지용 - 스캐너 유지
        },
        () => {}
      )
    })

    return () => {
      scannerRef.current?.clear().catch(() => {})
    }
  }, [onScan])

  return (
    <div className="w-full flex flex-col items-center">
      <div id="qr-camera-reader" className="w-full max-w-sm" />
      <p className="text-slate-400 text-xs mt-3">카메라가 QR코드를 자동으로 인식합니다</p>
    </div>
  )
}
