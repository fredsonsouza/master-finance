import { api } from './api-client'

export interface UpdateEvaluationRequest {
  rating?: 'EXCELLENT' | 'GOOD' | 'REGULAR' | 'BAD'
  presetComment?: string | null
  observation?: string | null
}

export async function updateEvaluation(
  token: string,
  id: string,
  data: UpdateEvaluationRequest
) {
  await api.put(`evaluations/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: data,
  })
}
