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

interface GetCashClosuresResponse {
  closures: CashClosure[]
}

export async function getCashClosures(token: string, unitId?: string | null) {
  const result = await api
    .get('cash-closures', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams: unitId ? { unitId } : undefined,
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
