import { api } from './api-client'

interface UpdateItemRequest {
  id: string
  name?: string
  description?: string
  categoryId?: string | null
  sectorId?: string | null
  quantity?: number
}

export async function updateItem(token: string, data: UpdateItemRequest) {
  const { id, ...body } = data

  await api.put(`items/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: body,
  })
}
