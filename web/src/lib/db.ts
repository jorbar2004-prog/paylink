import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { Payment } from '../types'

interface PayLinkDB extends DBSchema {
  payments: {
    key: string
    value: Payment
    indexes: { 'by-date': string; 'by-category': string }
  }
  settings: {
    key: string
    value: string
  }
}

let db: IDBPDatabase<PayLinkDB>

export async function initDB() {
  db = await openDB<PayLinkDB>('paylink-db', 1, {
    upgrade(db) {
      const store = db.createObjectStore('payments', { keyPath: 'id' })
      store.createIndex('by-date', 'date')
      store.createIndex('by-category', 'category')
      db.createObjectStore('settings')
    },
  })
  return db
}

export async function addPayment(payment: Payment) {
  if (!db) await initDB()
  await db.put('payments', payment)
}

export async function getPayments(): Promise<Payment[]> {
  if (!db) await initDB()
  return db.getAllFromIndex('payments', 'by-date')
}

export async function updatePayment(id: string, updates: Partial<Payment>) {
  if (!db) await initDB()
  const existing = await db.get('payments', id)
  if (!existing) return
  await db.put('payments', { ...existing, ...updates })
}

export async function deletePayment(id: string) {
  if (!db) await initDB()
  await db.delete('payments', id)
}

export async function getSetting(key: string): Promise<string | undefined> {
  if (!db) await initDB()
  return db.get('settings', key)
}

export async function setSetting(key: string, value: string) {
  if (!db) await initDB()
  await db.put('settings', value, key)
}
