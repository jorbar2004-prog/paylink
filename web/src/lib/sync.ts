import { getPayments, getSetting, setSetting, updatePayment } from './db'
import { encrypt } from './crypto'

const API_URL = import.meta.env.VITE_API_URL || ''

export async function syncPayments(passphrase: string): Promise<boolean> {
  if (!API_URL) return false

  const deviceId = await getDeviceId()
  const payments = await getPayments()
  const unsynced = payments.filter(p => !p.synced)

  if (unsynced.length === 0) return true

  const payload = JSON.stringify({
    deviceId,
    payments: unsynced.map(p => ({
      id: p.id,
      date: p.date,
      amount: p.amount,
      merchantName: p.merchantName,
      category: p.category,
    })),
  })

  const encrypted = await encrypt(payload, passphrase)

  try {
    const res = await fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: encrypted }),
    })

    if (!res.ok) throw new Error('Sync failed')

    const { imported } = await res.json()
    for (const id of imported) {
      await updatePayment(id, { synced: true })
    }
    return true
  } catch {
    return false
  }
}

async function getDeviceId(): Promise<string> {
  let id = await getSetting('device-id')
  if (!id) {
    id = crypto.randomUUID()
    await setSetting('device-id', id)
  }
  return id
}
