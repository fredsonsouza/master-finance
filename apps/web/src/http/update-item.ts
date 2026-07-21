import { api } from './api-client'

interface UpdateItemRequest {
  id: string
  name?: string
  description?: string | null
  sectorId?: string | null
  quantity?: number
}

export async function updateItem(token: string, data: UpdateItemRequest) {
  const { id, ...payload } = data
  await api.put(`items/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: payload,
  })
}
