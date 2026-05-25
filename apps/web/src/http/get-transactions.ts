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
  userId: string
  createdAt: string
  updatedAt: string
}

interface GetTransactionsResponse {
  transactions: Transaction[]
}

export async function getTransactions(token: string) {
  const result = await api
    .get('transactions', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        tags: ['transactions'],
      },
    })
    .json<GetTransactionsResponse>()

  return result
}
