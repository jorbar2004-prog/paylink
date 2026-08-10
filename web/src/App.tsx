import { useState } from 'react'
import { View, Merchant } from './types'
import Navbar from './components/Navbar'
import QRScanner from './components/QRScanner'
import PaymentForm from './components/PaymentForm'
import History from './components/History'
import Stats from './components/Stats'

export default function App() {
  const [view, setView] = useState<View>('scan')
  const [scannedMerchant, setScannedMerchant] = useState<Merchant | null>(null)

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col max-w-md mx-auto shadow-2xl">
      <main className="flex-1 overflow-y-auto">
        {view === 'scan' && !scannedMerchant && (
          <QRScanner onScan={setScannedMerchant} />
        )}
        {view === 'scan' && scannedMerchant && (
          <PaymentForm
            merchant={scannedMerchant}
            onClose={() => setScannedMerchant(null)}
            onDone={() => { setScannedMerchant(null); setView('history') }}
          />
        )}
        {view === 'history' && <History />}
        {view === 'stats' && <Stats />}
      </main>
      <Navbar current={view} onChange={setView} />
    </div>
  )
}
