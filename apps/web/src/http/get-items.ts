import { api } from './api-client'

export interface Item {
  id: string
  name: string
  description: string | null
  value: number
  quantity: number
  categoryId?: string | null
  sectorId?: string | null
  createdAt: string
  updatedAt: string
  category?: {
    id: string
    name: string
  } | null
  sector?: {
    id: string
    name: string
  } | null
}

export interface ItemPagination {
  page: number
  perPage: number
  totalCount: number
  totalPages: number
}

interface GetItemsResponse {
  items: Item[]
  pagination: ItemPagination
}

export async function getItems(
  token: string,
  params?: {
    search?: string | null
    categoryId?: string | null
    sectorId?: string | null
    page?: number
    perPage?: number
  }
) {
  const searchParams: Record<string, string> = {}
  if (params?.search) searchParams.search = params.search
  if (params?.categoryId) searchParams.categoryId = params.categoryId
  if (params?.sectorId) searchParams.sectorId = params.sectorId
  if (params?.page) searchParams.page = String(params.page)
  if (params?.perPage) searchParams.perPage = String(params.perPage)

  const result = await api
    .get('items', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams: Object.keys(searchParams).length > 0 ? searchParams : undefined,
      next: {
        tags: ['items'],
        revalidate: 0,
      },
    })
    .json<GetItemsResponse>()

  return result
}

export async function getAllItems(token: string): Promise<Item[]> {
  try {
    const firstPage = await getItems(token, { page: 1, perPage: 1000 })
    let allItems = [...firstPage.items]
    if (firstPage.pagination && firstPage.pagination.totalPages > 1) {
      for (let p = 2; p <= firstPage.pagination.totalPages; p++) {
        const nextPage = await getItems(token, { page: p, perPage: 1000 })
        allItems = allItems.concat(nextPage.items)
      }
    }
    return allItems
  } catch (err) {
    console.error('Error fetching all items:', err)
    return []
  }
}
