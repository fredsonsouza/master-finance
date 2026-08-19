'use server'

import { auth } from '@/auth/auth'
import { deleteEvaluation } from '@/http/delete-evaluation'
import { getEvaluations } from '@/http/get-evaluations'
import { updateEvaluation } from '@/http/update-evaluation'
import { revalidatePath } from 'next/cache'

export async function fetchEvaluationsAction(params?: {
  sellerId?: string | null
  unitId?: string | null
  podiumUnitId?: string | null
  podiumMonth?: string | null
  startDate?: string | null
  endDate?: string | null
  page?: number
  perPage?: number
}) {
  const { token } = await auth()
  if (!token) return { success: false, data: null, message: 'Não autenticado' }

  try {
    const data = await getEvaluations(token, params)
    return { success: true, data, message: null }
  } catch (err: unknown) {
    return { success: false, data: null, message: 'Erro ao buscar avaliações.' }
  }
}

export async function deleteEvaluationAction(id: string) {
  const { token, user } = await auth()
  if (!token || user.role !== 'ADMIN') {
    return { success: false, message: 'Apenas Administradores podem excluir avaliações.' }
  }

  try {
    await deleteEvaluation(token, id)
    revalidatePath('/evaluations')
    return { success: true, message: null }
  } catch (err: unknown) {
    return { success: false, message: 'Erro ao excluir avaliação.' }
  }
}

export async function updateEvaluationAction(
  id: string,
  data: {
    rating?: 'EXCELLENT' | 'GOOD' | 'REGULAR' | 'BAD'
    presetComment?: string | null
    observation?: string | null
  }
) {
  const { token, user } = await auth()
  if (!token || user.role !== 'ADMIN') {
    return { success: false, message: 'Apenas Administradores podem editar avaliações.' }
  }

  try {
    await updateEvaluation(token, id, data)
    revalidatePath('/evaluations')
    return { success: true, message: null }
  } catch (err: unknown) {
    return { success: false, message: 'Erro ao atualizar avaliação.' }
  }
}
