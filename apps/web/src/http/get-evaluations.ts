import { api } from './api-client'

export interface EvaluationItem {
  id: string
  clientName: string | null
  rating: 'EXCELLENT' | 'GOOD' | 'REGULAR' | 'BAD'
  presetComment: string | null
  observation: string | null
  createdAt: string
  sellerId: string
  seller: {
    id: string
    name: string
    avatarUrl: string | null
  }
  unit: {
    id: string
    name: string
  } | null
}

export interface EvaluationMetrics {
  total: number
  excellentCount: number
  goodCount: number
  regularCount: number
  badCount: number
  satisfactionRate: number
}

export interface PodiumItem {
  position: number
  sellerId: string
  sellerName: string
  sellerAvatarUrl: string | null
  unitId: string | null
  unitName: string | null
  totalEvaluations: number
  excellentCount: number
  goodCount: number
  satisfactionRate: number
  score: number
}

export interface EvaluationPagination {
  page: number
  perPage: number
  totalCount: number
  totalPages: number
}

interface GetEvaluationsResponse {
  evaluations: EvaluationItem[]
  pagination: EvaluationPagination
  metrics: EvaluationMetrics
  podium: PodiumItem[]
}

export async function getEvaluations(
  token: string,
  params?: {
    sellerId?: string | null
    unitId?: string | null
    podiumUnitId?: string | null
    podiumMonth?: string | null
    startDate?: string | null
    endDate?: string | null
    page?: number
    perPage?: number
  }
) {
  const searchParams: Record<string, string> = {}
  if (params?.sellerId) searchParams.sellerId = params.sellerId
  if (params?.unitId) searchParams.unitId = params.unitId
  if (params?.podiumUnitId) searchParams.podiumUnitId = params.podiumUnitId
  if (params?.podiumMonth) searchParams.podiumMonth = params.podiumMonth
  if (params?.startDate) searchParams.startDate = params.startDate
  if (params?.endDate) searchParams.endDate = params.endDate
  if (params?.page) searchParams.page = String(params.page)
  if (params?.perPage) searchParams.perPage = String(params.perPage)

  const result = await api
    .get('evaluations', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams: Object.keys(searchParams).length > 0 ? searchParams : undefined,
      next: {
        revalidate: 0,
      },
    })
    .json<GetEvaluationsResponse>()

  return result
}
