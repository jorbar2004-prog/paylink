import { useEffect, useState } from 'react'
import { Payment } from '../types'
import { getPayments, deletePayment } from '../lib/db'
import { syncPayments } from '../lib/sync'
import { Trash2, RefreshCw, ArrowDownLeft } from 'lucide-react'

export default function History() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const data = await getPayments()
    setPayments(data.reverse())
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return
    await deletePayment(id)
    await load()
  }

  const handleSync = async () => {
    setSyncing(true)
    const passphrase = prompt('Ingresá tu passphrase de backup:')
    if (passphrase) {
      await syncPayments(passphrase)
      await load()
    }
    setSyncing(false)
  }

  const total = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 bg-neutral-900 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium">Historial</h1>
          <button onClick={handleSync} disabled={syncing} className="p-2 hover:bg-white/10 rounded-lg">
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-3xl font-medium mt-2">${total.toLocaleString('es-AR')}</p>
        <p className="text-sm text-neutral-400">{payments.length} pagos registrados</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
            <ArrowDownLeft size={40} className="mb-3" />
            <p>Todavía no registraste pagos</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {payments.map(p => (
              <div key={p.id} className="p-4 flex items-center justify-between group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{p.merchantName}</p>
                    {!p.synced && <span className="w-2 h-2 bg-amber-400 rounded-full" title="Sin sincronizar" />}
                  </div>
                  <p className="text-sm text-neutral-500">
                    {new Date(p.date).toLocaleDateString('es-AR')} · {p.category}
                    {p.notes && ` · ${p.notes}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">${p.amount.toLocaleString('es-AR')}</span>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
