import { api } from './api-client'

export interface Item {
  id: string
  name: string
  description: string | null
  unitId: string
  sectorId: string | null
  createdAt: string
  updatedAt: string
  sector?: {
    id: string
    name: string
  } | null
  unit?: {
    name: string
  } | null
}

interface GetItemsResponse {
  items: Item[]
}

export async function getItems(token: string, unitId?: string | null) {
  const result = await api
    .get('items', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams: unitId ? { unitId } : undefined,
      next: {
        tags: ['items'],
      },
    })
    .json<GetItemsResponse>()

  return result
}
