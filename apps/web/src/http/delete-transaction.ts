import { api } from './api-client'

export async function deleteTransaction(token: string, id: string) {
  await api.delete(`transactions/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
