import { api } from './api-client'

export interface Item {
  id: string
  name: string
  description: string | null
  quantity: number
  sectorId: string | null
  createdAt: string
  updatedAt: string
  sector?: {
    id: string
    name: string
  } | null
}

interface GetItemsResponse {
  items: Item[]
}

export async function getItems(token: string) {
  const result = await api
    .get('items', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        tags: ['items'],
      },
    })
    .json<GetItemsResponse>()

  return result
}
