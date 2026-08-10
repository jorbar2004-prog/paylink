import { useEffect, useState } from 'react'
import { Payment } from '../types'
import { getPayments } from '../lib/db'

export default function Stats() {
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    getPayments().then(data => setPayments(data))
  }, [])

  const byCategory = payments.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.amount
    return acc
  }, {} as Record<string, number>)

  const total = payments.reduce((s, p) => s + p.amount, 0)
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  const COLORS = ['#171717', '#525252', '#a3a3a3', '#d4d4d4', '#e5e5e5', '#f5f5f5']

  return (
    <div className="flex flex-col h-full bg-white p-4">
      <h1 className="text-lg font-medium mb-4">Estadísticas</h1>

      {entries.length === 0 ? (
        <p className="text-neutral-400 text-center py-12">Sin datos suficientes</p>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {entries.map(([cat, amount], i) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{cat}</span>
                  <span>${amount.toLocaleString('es-AR')}</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(amount / total) * 100}%`,
                      backgroundColor: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-neutral-50 rounded-xl p-4">
            <p className="text-sm text-neutral-500">Total gastado</p>
            <p className="text-2xl font-medium">${total.toLocaleString('es-AR')}</p>
            <p className="text-sm text-neutral-500 mt-1">{payments.length} transacciones</p>
          </div>
        </>
      )}
    </div>
  )
}
