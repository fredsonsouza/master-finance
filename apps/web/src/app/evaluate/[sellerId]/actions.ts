'use server'

import { createEvaluation } from '@/http/create-evaluation'

interface CreateEvaluationParams {
  sellerId: string
  clientName: string
  rating: 'EXCELLENT' | 'GOOD' | 'REGULAR' | 'BAD'
  presetComment?: string | null
  observation?: string | null
}

export async function createEvaluationAction(data: CreateEvaluationParams) {
  try {
    const result = await createEvaluation(data)
    return { success: true, evaluationId: result.evaluationId }
  } catch (err: unknown) {
    let errorMessage = 'Erro ao enviar avaliação.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const response = (err as { response: Response }).response
        const errorData = await response.json()
        if (errorData.message) errorMessage = errorData.message
      } catch {}
    }
    return { success: false, message: errorMessage }
  }
}
