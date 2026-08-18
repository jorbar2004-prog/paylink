import { useEffect, useState } from 'react'
import { Merchant, Payment } from '../types'
import { addPayment, getSetting, setSetting } from '../lib/db'
import { formatCBU } from '../lib/cbu'
import { Copy, Check, ArrowLeft, Send, Building2, User, AlertTriangle } from 'lucide-react'

interface Props {
  merchant: Merchant
  onClose: () => void
  onDone: () => void
}

const CATEGORIES = [
  'Alimentos', 'Transporte', 'Servicios', 'Salud', 'Entretenimiento',
  'Ropa', 'Educación', 'Otros'
]

// Esquemas de deep-link "best effort": no todos los bancos los soportan ni
// están garantizados, y pueden cambiar sin aviso. Si el esquema no abre nada,
// igual quedan los datos copiados al portapapeles como respaldo.
const BANKS = [
  { id: 'generic', label: 'Solo copiar (sin abrir app)', scheme: '' },
  { id: 'bancociudad', label: 'Banco Ciudad', scheme: 'bancociudad://' },
  { id: 'galicia', label: 'Galicia / Banco Galicia', scheme: 'galicia://' },
  { id: 'santander', label: 'Santander', scheme: 'santander://' },
  { id: 'bbva', label: 'BBVA', scheme: 'bbva://' },
  { id: 'macro', label: 'Macro', scheme: 'macro://' },
  // BPN no tiene un scheme custom documentado públicamente; en vez de adivinar
  // uno, usamos un Android Intent apuntando al package real de "Mi BPN" (su
  // billetera con QR), con fallback a la Play Store si no está instalada.
  // Solo funciona en Android/Chrome, no en iOS.
  { id: 'bpn', label: 'BPN (Mi BPN)', scheme: 'intent://#Intent;package=com.poincenot.bpn.mobile;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.poincenot.bpn.mobile;end' },
  { id: 'mercadopago', label: 'Mercado Pago', scheme: 'mercadopago://' },
  { id: 'uala', label: 'Ualá', scheme: 'uala://' },
  { id: 'brubank', label: 'Brubank', scheme: 'brubank://' },
]

export default function PaymentForm({ merchant, onClose, onDone }: Props) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Alimentos')
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState<'cbu' | 'alias' | null>(null)
  const [paid, setPaid] = useState(false)
  const [bankId, setBankId] = useState('generic')

  useEffect(() => {
    getSetting('preferred-bank').then(saved => {
      if (saved) setBankId(saved)
    })
  }, [])

  const amountNumber = Number(amount)
  const amountValid = amount !== '' && Number.isFinite(amountNumber) && amountNumber > 0

  const copyToClipboard = async (text: string, type: 'cbu' | 'alias') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleBankChange = async (id: string) => {
    setBankId(id)
    await setSetting('preferred-bank', id)
  }

  const openBankApp = () => {
    const text = `Transferir $${amount} a ${merchant.name}\nCBU: ${merchant.cbu}\nAlias: ${merchant.alias}`
    navigator.clipboard.writeText(text)
    const bank = BANKS.find(b => b.id === bankId)
    if (bank?.scheme) {
      window.location.href = bank.scheme
    }
    // Si no hay esquema (o el banco no tiene app instalada), no pasa nada más:
    // los datos ya quedaron copiados para pegar a mano en el home banking.
  }

  const handlePay = async () => {
    if (!amountValid) return
    const payment: Payment = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount: amountNumber,
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
        {merchant.cbu && merchant.cbuValid === false && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <p>El CBU no pasó la validación del dígito verificador. Puede que el QR se haya leído mal — revisá los datos antes de transferir.</p>
          </div>
        )}

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
                <p className="font-mono text-sm">{formatCBU(merchant.cbu)}</p>
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
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="3500"
            className="w-full p-4 text-2xl font-medium border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          {amount !== '' && !amountValid && (
            <p className="text-xs text-red-600 mt-1">Ingresá un monto mayor a $0.</p>
          )}
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

        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-2">Tu banco (para "Abrir banco")</label>
          <select
            value={bankId}
            onChange={(e) => handleBankChange(e.target.value)}
            className="w-full p-3 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            {BANKS.map(b => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
          <p className="text-xs text-neutral-400 mt-1">
            Se guarda para la próxima vez. Si no abre tu app automáticamente, los datos igual quedan copiados.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-neutral-100 space-y-3 safe-bottom">
        <button
          onClick={openBankApp}
          disabled={!amountValid}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-neutral-100 text-neutral-900 rounded-xl font-medium disabled:opacity-40"
        >
          <Building2 size={18} />
          Abrir banco y copiar datos
        </button>
        <button
          onClick={handlePay}
          disabled={!amountValid}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-neutral-900 text-white rounded-xl font-medium disabled:opacity-40"
        >
          <Send size={18} />
          Ya transferí, guardar
        </button>
      </div>
    </div>
  )
}
