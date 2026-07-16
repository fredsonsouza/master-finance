import { api } from './api-client'

export interface MonthlyHistory {
  month: string
  count: number
}

export interface CollectorRanking {
  name: string
  count: number
}

export interface TopExam {
  name: string
  count: number
}

export interface GetCollectionsReportsResponse {
  monthlyHistory: MonthlyHistory[]
  collectorRanking: CollectorRanking[]
  topExams: TopExam[]
}

export async function getCollectionsReports(
  token: string,
  unitId?: string | null,
  month?: string
) {
  const result = await api
    .get('metrics/reports/collections', {
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
    .json<GetCollectionsReportsResponse>()

  return result
}
