import { api } from './api-client'

export interface DashboardGroup {
  id: string
  name: string
  entries: number
  exits: number
  balance: number
}

interface GetDashboardMetricsResponse {
  groups: DashboardGroup[]
  totalEntries: number
  totalExits: number
  totalBalance: number
}

export async function getDashboardMetrics(
  token: string,
  unitId?: string | null
) {
  const result = await api
    .get('metrics/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams: unitId ? { unitId } : undefined,
      next: {
        revalidate: 0,
      },
    })
    .json<GetDashboardMetricsResponse>()

  return result
}
