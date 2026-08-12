import { api } from './api-client'

export async function deleteEvaluation(token: string, id: string) {
  await api.delete(`evaluations/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
