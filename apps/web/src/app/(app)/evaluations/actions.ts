'use server'

import { auth } from '@/auth/auth'
import { deleteEvaluation } from '@/http/delete-evaluation'
import { updateEvaluation } from '@/http/update-evaluation'
import { revalidatePath } from 'next/cache'

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
