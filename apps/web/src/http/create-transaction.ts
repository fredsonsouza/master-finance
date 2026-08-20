import { api } from './api-client'

export interface CreateTransactionItem {
  itemId: string
  quantity: number
  value: number
}

export interface CreateTransactionRequest {
  type: 'ENTRY' | 'EXIT'
  date: string
  unitId: string
  sectorId?: string | null
  items: CreateTransactionItem[]
}

export async function createTransaction(
  token: string,
  data: CreateTransactionRequest
) {
  await api.post('transactions', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: data,
  })
}
