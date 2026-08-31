import { api } from './api-client'

export async function deleteHrReport(token: string, id: string) {
  await api.delete(`hr-reports/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
