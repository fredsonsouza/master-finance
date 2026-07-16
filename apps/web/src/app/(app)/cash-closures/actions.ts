'use server'

import { getActiveUnit } from '@/components/unit-switcher-action'
import {
  changeCashClosureStatusAction,
  createCashClosureAction,
  deleteCashClosureAction,
  updateCashClosureAction,
} from '@/http/cash-closures'
import { revalidatePath } from 'next/cache'

import { auth } from '@/auth/auth'

export async function createCashClosure(data: {
  cashDate: string
  value: number
  observation?: string
  sectorId?: string
  userId?: string
}) {
  try {
    const { token } = await auth()
    const unitId = await getActiveUnit()

    if (!unitId)
      return {
        success: false,
        message: 'Nenhuma unidade vinculada ao seu usuário.',
      }

    const success = await createCashClosureAction(token, {
      ...data,
      unitId,
    })

    if (success) {
      revalidatePath('/cash-closures')
      return { success: true }
    }
    return { success: false, message: 'Erro ao criar fechamento.' }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return { success: false, message }
  }
}

export async function updateCashClosure(
  id: string,
  data: {
    cashDate: string
    value: number
    observation?: string
  }
) {
  try {
    const { token } = await auth()
    const success = await updateCashClosureAction(token, id, data)
    if (success) {
      revalidatePath('/cash-closures')
      return { success: true }
    }
    return { success: false, message: 'Erro ao atualizar fechamento.' }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return { success: false, message }
  }
}

export async function deleteCashClosure(id: string) {
  try {
    const { token } = await auth()
    const success = await deleteCashClosureAction(token, id)
    if (success) {
      revalidatePath('/cash-closures')
      return { success: true }
    }
    return { success: false, message: 'Erro ao excluir fechamento.' }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return { success: false, message }
  }
}

export async function changeCashClosureStatus(
  id: string,
  status: 'OPEN' | 'CLOSED'
) {
  try {
    const { token } = await auth()
    const success = await changeCashClosureStatusAction(token, id, status)
    if (success) {
      revalidatePath('/cash-closures')
      return { success: true }
    }
    return { success: false, message: 'Erro ao alterar status.' }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return { success: false, message }
  }
}
