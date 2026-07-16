import { api } from './api-client'

export async function deleteUnit(token: string, id: string) {
  await api.delete(`units/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
