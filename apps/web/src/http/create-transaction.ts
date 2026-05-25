import { api } from './api-client'

interface CreateTransactionRequest {
  type: 'ENTRY' | 'EXIT'
  date?: string
  value: number
  quantity: number
  itemId: string
  unitId?: string
}

export async function createTransaction(token: string, data: CreateTransactionRequest) {
  await api.post('transactions', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: data,
  })
}
