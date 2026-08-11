import { api } from './api-client'

interface CreateEvaluationRequest {
  sellerId: string
  rating: 'EXCELLENT' | 'GOOD' | 'REGULAR' | 'BAD'
  presetComment?: string | null
  observation?: string | null
}

export async function createEvaluation(data: CreateEvaluationRequest) {
  const result = await api
    .post('evaluations/public', {
      json: data,
    })
    .json<{ evaluationId: string }>()

  return result
}
