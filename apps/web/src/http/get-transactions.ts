import { api } from './api-client'

export interface Transaction {
  id: string
  type: 'ENTRY' | 'EXIT'
  date: string
  month: string
  value: number
  quantity: number
  itemId: string
  unitId: string
  sectorId?: string | null
  userId: string
  batchId?: string | null
  createdAt: string
  updatedAt: string
  item: {
    id: string
    name: string
    description?: string | null
    sector: {
      id: string
      name: string
    } | null
  }
  sector?: {
    id: string
    name: string
  } | null
  unit?: {
    name: string
  }
}

export interface TransactionPagination {
  page: number
  perPage: number
  totalCount: number
  totalPages: number
}

interface GetTransactionsResponse {
  transactions: Transaction[]
  pagination: TransactionPagination
}

export async function getTransactions(
  token: string,
  params?: {
    unitId?: string | null
    type?: string | null
    search?: string | null
    page?: number
    perPage?: number
    month?: string | null
    itemId?: string | null
  } | string | null
) {
  const searchParams: Record<string, string> = {}

  if (typeof params === 'string') {
    searchParams.unitId = params
  } else if (params && typeof params === 'object') {
    if (params.unitId && params.unitId !== 'ALL') searchParams.unitId = params.unitId
    if (params.type && params.type !== 'ALL') searchParams.type = params.type
    if (params.search && params.search.trim().length > 0) searchParams.search = params.search.trim()
    if (params.page) searchParams.page = String(params.page)
    if (params.perPage) searchParams.perPage = String(params.perPage)
    if (params.month) searchParams.month = params.month
    if (params.itemId) searchParams.itemId = params.itemId
  }

  const result = await api
    .get('transactions', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams: Object.keys(searchParams).length > 0 ? searchParams : undefined,
      next: {
        tags: ['transactions'],
        revalidate: 0,
      },
    })
    .json<GetTransactionsResponse>()

  return result
}
