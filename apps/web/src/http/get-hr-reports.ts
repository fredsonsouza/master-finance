import { api } from './api-client'

export interface HrReport {
  id: string
  title: string
  content: string
  reportDate: string
  status: 'DRAFT' | 'SENT'
  sentAt: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    username: string
    role: string
  }
  unit: {
    id: string
    name: string
  } | null
  sector: string | null
}

export interface HrReportPagination {
  page: number
  perPage: number
  totalCount: number
  totalPages: number
}

interface GetHrReportsResponse {
  reports: HrReport[]
  pagination: HrReportPagination
}

export async function getHrReports(
  token: string,
  params?: {
    status?: 'DRAFT' | 'SENT'
    unitId?: string | null
    sector?: string | null
    userId?: string | null
    startDate?: string | null
    endDate?: string | null
    search?: string | null
    page?: number
    perPage?: number
  }
) {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.unitId) searchParams.set('unitId', params.unitId)
  if (params?.sector) searchParams.set('sector', params.sector)
  if (params?.userId) searchParams.set('userId', params.userId)
  if (params?.startDate) searchParams.set('startDate', params.startDate)
  if (params?.endDate) searchParams.set('endDate', params.endDate)
  if (params?.search) searchParams.set('search', params.search)
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.perPage) searchParams.set('perPage', String(params.perPage))

  const queryString = searchParams.toString()
  const url = queryString ? `hr-reports?${queryString}` : 'hr-reports'

  const result = await api
    .get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        tags: ['hr-reports'],
      },
    })
    .json<GetHrReportsResponse>()

  return result
}
