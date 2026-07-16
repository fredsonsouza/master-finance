import { api } from './api-client'

export interface Transaction {
  id: string
  type: 'ENTRY' | 'EXIT'
  date: string
  month: string
  value: number
  quantity: number
  itemId: string
  unitId: string
  sectorId?: string | null
  userId: string
  batchId?: string | null
  createdAt: string
  updatedAt: string
  item: {
    id: string
    name: string
    sector: {
      id: string
      name: string
    } | null
  }
  sector?: {
    id: string
    name: string
  } | null
  unit?: {
    name: string
  }
}

interface GetTransactionsResponse {
  transactions: Transaction[]
}

export async function getTransactions(token: string, unitId?: string | null) {
  const result = await api
    .get('transactions', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams: unitId ? { unitId } : undefined,
      next: {
        tags: ['transactions'],
        revalidate: 0,
      },
    })
    .json<GetTransactionsResponse>()

  return result
}
