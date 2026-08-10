import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { parseQR } from '../lib/qrParser'
import { Merchant } from '../types'
import { Zap, ZapOff } from 'lucide-react'

interface Props {
  onScan: (m: Merchant) => void
}

export default function QRScanner({ onScan }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [torch, setTorch] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        const merchant = parseQR(decodedText)
        if (merchant) {
          scanner.stop().catch(() => {})
          onScan(merchant)
        } else {
          setError('QR no reconocido. Intentá con otro.')
        }
      },
      () => {}
    ).catch(() => setError('No se pudo acceder a la cámara.'))

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [onScan])

  const toggleTorch = () => setTorch(!torch)

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-neutral-900 text-white">
        <h1 className="text-lg font-medium">PayLink</h1>
        <p className="text-sm text-neutral-400">Escaneá el QR del comercio</p>
      </div>
      <div className="relative flex-1 bg-black">
        <div id="qr-reader" className="w-full h-full" />
        <button
          onClick={toggleTorch}
          className="absolute bottom-6 right-6 p-3 bg-white/20 backdrop-blur rounded-full text-white"
        >
          {torch ? <ZapOff size={20} /> : <Zap size={20} />}
        </button>
      </div>
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm text-center">
          {error}
          <button onClick={() => setError('')} className="block mx-auto mt-2 text-xs underline">
            Cerrar
          </button>
        </div>
      )}
      <div className="p-4 bg-white text-center text-sm text-neutral-500">
        Apuntá al QR de transferencia del comercio
      </div>
    </div>
  )
}
