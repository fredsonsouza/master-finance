import { api } from './api-client'
import type { HrReport } from './get-hr-reports'

interface CreateHrReportRequest {
  title: string
  content: string
  reportDate: string
  status?: 'DRAFT' | 'SENT'
  unitId?: string | null
  sector?: string | null
}

interface CreateHrReportResponse {
  reportId: string
  report: HrReport
}

export async function createHrReport(
  token: string,
  data: CreateHrReportRequest
) {
  const result = await api
    .post('hr-reports', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      json: data,
    })
    .json<CreateHrReportResponse>()

  return result
}
