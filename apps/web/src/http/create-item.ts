import { api } from './api-client'

interface CreateItemRequest {
  name: string
  description?: string
  categoryId?: string | null
  sectorId?: string | null
  quantity?: number
}

export async function createItem(token: string, data: CreateItemRequest) {
  await api.post('items', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: data,
  })
}
