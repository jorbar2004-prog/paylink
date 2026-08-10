export interface Payment {
  id: string
  date: string
  amount: number
  currency: string
  merchantName: string
  cbu: string
  alias: string
  category: string
  notes: string
  status: 'pending' | 'completed' | 'cancelled'
  synced: boolean
}

export interface Merchant {
  name: string
  cbu: string
  alias: string
}

export type View = 'scan' | 'history' | 'stats'
