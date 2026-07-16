import { api } from './api-client'

export interface MonthlyFlow {
  month: string
  entries: number
  exits: number
}

export interface TopItem {
  name: string
  cost: number
  quantity: number
}

export interface CostData {
  name: string
  cost: number
}

export interface GetExecutiveReportsResponse {
  monthlyFlow: MonthlyFlow[]
  topItems: TopItem[]
  costBySector: CostData[]
  costByUnit: CostData[]
}

export async function getExecutiveReports(
  token: string,
  unitId?: string | null,
  month?: string
) {
  const result = await api
    .get('metrics/reports/executive', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams: {
        ...(unitId ? { unitId } : {}),
        ...(month ? { month } : {}),
      },
      next: {
        revalidate: 0,
      },
    })
    .json<GetExecutiveReportsResponse>()

  return result
}
