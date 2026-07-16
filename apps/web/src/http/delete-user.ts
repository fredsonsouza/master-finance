import { api } from './api-client'

export async function deleteUser(token: string, id: string) {
  await api.delete(`users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
