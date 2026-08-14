import { api } from './api-client'

export interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId: string | null
  details: string
  createdAt: string
  user: {
    id: string
    name: string
    username: string
    role: string
  }
}

export interface AuditLogPagination {
  page: number
  perPage: number
  totalCount: number
  totalPages: number
}

interface GetLogsResponse {
  logs: AuditLog[]
  pagination: AuditLogPagination
}

export async function getLogs(
  token: string,
  filters?: {
    resource?: string
    action?: string
    search?: string
    startDate?: string
    endDate?: string
    page?: number
    perPage?: number
  }
) {
  const searchParams: Record<string, string> = {}
  if (filters?.resource) searchParams.resource = filters.resource
  if (filters?.action) searchParams.action = filters.action
  if (filters?.search) searchParams.search = filters.search
  if (filters?.startDate) searchParams.startDate = filters.startDate
  if (filters?.endDate) searchParams.endDate = filters.endDate
  if (filters?.page) searchParams.page = String(filters.page)
  if (filters?.perPage) searchParams.perPage = String(filters.perPage)

  const result = await api
    .get('logs', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams:
        Object.keys(searchParams).length > 0 ? searchParams : undefined,
      next: {
        revalidate: 0,
      },
    })
    .json<GetLogsResponse>()

  return result
}
