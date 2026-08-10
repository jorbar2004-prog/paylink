import { useState } from 'react'
import { Merchant, Payment } from '../types'
import { addPayment } from '../lib/db'
import { Copy, Check, ArrowLeft, Send, Building2, User } from 'lucide-react'

interface Props {
  merchant: Merchant
  onClose: () => void
  onDone: () => void
}

const CATEGORIES = [
  'Alimentos', 'Transporte', 'Servicios', 'Salud', 'Entretenimiento',
  'Ropa', 'Educación', 'Otros'
]

export default function PaymentForm({ merchant, onClose, onDone }: Props) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Alimentos')
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState<'cbu' | 'alias' | null>(null)
  const [paid, setPaid] = useState(false)

  const copyToClipboard = async (text: string, type: 'cbu' | 'alias') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const openBankApp = () => {
    const text = `Transferir $${amount} a ${merchant.name}\nCBU: ${merchant.cbu}\nAlias: ${merchant.alias}`
    navigator.clipboard.writeText(text)
    const banks = ['bancociudad://', 'galicia://', 'santander://', 'bbva://', 'macro://']
    window.location.href = banks[0]
  }

  const handlePay = async () => {
    const payment: Payment = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount: Number(amount),
      currency: 'ARS',
      merchantName: merchant.name,
      cbu: merchant.cbu,
      alias: merchant.alias,
      category,
      notes,
      status: 'completed',
      synced: false,
    }
    await addPayment(payment)
    setPaid(true)
  }

  if (paid) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-medium mb-2">¡Listo!</h2>
        <p className="text-neutral-500 mb-6">El pago se registró en tu historial.</p>
        <button onClick={onDone} className="w-full py-3 bg-neutral-900 text-white rounded-xl font-medium">
          Ver historial
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 p-4 border-b border-neutral-100">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-neutral-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-medium">Confirmar pago</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <p className="font-medium">{merchant.name}</p>
              <p className="text-xs text-neutral-500">Comercio</p>
            </div>
          </div>

          {merchant.cbu && (
            <button
              onClick={() => copyToClipboard(merchant.cbu, 'cbu')}
              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200 text-left"
            >
              <div>
                <p className="text-xs text-neutral-500">CBU</p>
                <p className="font-mono text-sm">{merchant.cbu}</p>
              </div>
              {copied === 'cbu' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            </button>
          )}

          {merchant.alias && (
            <button
              onClick={() => copyToClipboard(merchant.alias, 'alias')}
              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200 text-left"
            >
              <div>
                <p className="text-xs text-neutral-500">Alias</p>
                <p className="font-mono text-sm font-medium">{merchant.alias}</p>
              </div>
              {copied === 'alias' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            </button>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-2">Monto ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="3500"
            className="w-full p-4 text-2xl font-medium border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-2">Categoría</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === cat ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-2">Notas (opcional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Verduras de la semana"
            className="w-full p-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      <div className="p-4 border-t border-neutral-100 space-y-3 safe-bottom">
        <button
          onClick={openBankApp}
          disabled={!amount}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-neutral-100 text-neutral-900 rounded-xl font-medium disabled:opacity-40"
        >
          <Building2 size={18} />
          Abrir banco y copiar datos
        </button>
        <button
          onClick={handlePay}
          disabled={!amount}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-neutral-900 text-white rounded-xl font-medium disabled:opacity-40"
        >
          <Send size={18} />
          Ya transferí, guardar
        </button>
      </div>
    </div>
  )
}
