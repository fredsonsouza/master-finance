import { api } from './api-client'

export async function deleteSector(token: string, id: string) {
  await api.delete(`sectors/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
