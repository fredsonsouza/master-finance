import { api } from './api-client'

export interface CashClosure {
  id: string
  cashDate: string // DateTime returns as string from JSON
  value: number
  observation: string | null
  status: 'OPEN' | 'CLOSED'
  createdAt: string
  user: {
    id: string
    name: string
  }
  sector: {
    id: string
    name: string
  } | null
  unit: {
    id: string
    name: string
  }
}

export interface CashClosurePagination {
  page: number
  perPage: number
  totalCount: number
  totalPages: number
}

export interface GetCashClosuresParams {
  unitId?: string | null
  status?: 'OPEN' | 'CLOSED' | string | null
  sectorId?: string | null
  startDate?: string | null
  endDate?: string | null
  search?: string | null
  page?: number
  perPage?: number
}

export interface GetCashClosuresResponse {
  closures: CashClosure[]
  pagination: CashClosurePagination
}

export async function getCashClosures(
  token: string,
  params?: GetCashClosuresParams | string | null
) {
  const searchParams: Record<string, string> = {}

  if (typeof params === 'string') {
    if (params && params !== 'ALL') searchParams.unitId = params
  } else if (params) {
    if (params.unitId && params.unitId !== 'ALL')
      searchParams.unitId = params.unitId
    if (params.status && params.status !== 'ALL')
      searchParams.status = params.status
    if (params.sectorId && params.sectorId !== 'ALL')
      searchParams.sectorId = params.sectorId
    if (params.startDate) searchParams.startDate = params.startDate
    if (params.endDate) searchParams.endDate = params.endDate
    if (params.search?.trim()) searchParams.search = params.search.trim()
    if (params.page) searchParams.page = String(params.page)
    if (params.perPage) searchParams.perPage = String(params.perPage)
  }

  const result = await api
    .get('cash-closures', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams:
        Object.keys(searchParams).length > 0 ? searchParams : undefined,
      next: {
        tags: ['cash-closures'],
      },
    })
    .json<GetCashClosuresResponse>()

  return result
}

export async function createCashClosureAction(
  token: string,
  data: {
    cashDate: string
    value: number
    observation?: string
    unitId: string
    sectorId?: string
    userId?: string
  }
) {
  const result = await api.post('cash-closures', {
    headers: { Authorization: `Bearer ${token}` },
    json: data,
  })

  return result.ok
}

export async function updateCashClosureAction(
  token: string,
  id: string,
  data: {
    cashDate: string
    value: number
    observation?: string
  }
) {
  const result = await api.put(`cash-closures/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    json: data,
  })

  return result.ok
}

export async function changeCashClosureStatusAction(
  token: string,
  id: string,
  status: 'OPEN' | 'CLOSED'
) {
  const result = await api.patch(`cash-closures/${id}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    json: { status },
  })

  return result.ok
}

export async function deleteCashClosureAction(token: string, id: string) {
  const result = await api.delete(`cash-closures/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return result.ok
}
