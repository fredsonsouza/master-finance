import { api } from './api-client'
import type { HrReport } from './get-hr-reports'

interface UpdateHrReportRequest {
  title?: string
  content?: string
  reportDate?: string
  status?: 'DRAFT' | 'SENT'
  unitId?: string | null
  sector?: string | null
}

interface UpdateHrReportResponse {
  report: HrReport
}

export async function updateHrReport(
  token: string,
  id: string,
  data: UpdateHrReportRequest
) {
  const result = await api
    .put(`hr-reports/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      json: data,
    })
    .json<UpdateHrReportResponse>()

  return result
}
