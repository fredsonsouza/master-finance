import { api } from './api-client'

interface UpdateTransactionRequest {
  type?: 'ENTRY' | 'EXIT'
  date?: string
  value?: number
  quantity?: number
  itemId?: string
  sectorId?: string
}

export async function updateTransaction(
  token: string,
  id: string,
  data: UpdateTransactionRequest
) {
  await api.put(`transactions/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: data,
  })
}
