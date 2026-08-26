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
    // 1. Fetch page 1 with perPage: 100 (compatible with all API versions)
    const firstPage = await getItems(token, { page: 1, perPage: 100 })
    let allItems = [...(firstPage.items || [])]
    const totalPages = firstPage.pagination?.totalPages ?? 1

    // 2. If there are more pages, fetch all remaining pages in parallel
    if (totalPages > 1) {
      const pagePromises = []
      for (let p = 2; p <= totalPages; p++) {
        pagePromises.push(getItems(token, { page: p, perPage: 100 }))
      }
      const results = await Promise.all(pagePromises)
      for (const res of results) {
        if (res.items && res.items.length > 0) {
          allItems = allItems.concat(res.items)
        }
      }
    }
    return allItems
  } catch (err) {
    console.error('[getAllItems error]:', err)
    // Safe fallback to default
    try {
      const fallback = await getItems(token)
      return fallback.items || []
    } catch {
      return []
    }
  }
}
