'use server'

import { auth } from '@/auth/auth'
import { getActiveUnit } from '@/components/unit-switcher-action'
import {
  createCollectionActionApi,
  deleteCollectionActionApi,
  updateCollectionActionApi,
} from '@/http/collections'
import { getUsers } from '@/http/get-users'
import { revalidatePath, updateTag } from 'next/cache'

export async function fetchCollectorsAction() {
  try {
    const { token } = await auth()
    if (!token) return { success: false, users: [] }
    const res = await getUsers(token, null, 'COLLECTOR', null, 1, 200)
    return { success: true, users: res.users || [] }
  } catch {
    return { success: false, users: [] }
  }
}

export async function createCollection(data: {
  requestDate: string
  patientCode: string
  patientName: string
  exams: string[]
  reason: string
  collectorId: string
  pendingBy: string
  notifiedBy: string
  unitId?: string
}) {
  try {
    const { token } = await auth()
    const unitId = data.unitId || (await getActiveUnit())

    if (!unitId) {
      return { success: false, message: 'Nenhuma unidade ativa vinculada.' }
    }

    await createCollectionActionApi(token, {
      requestDate: data.requestDate,
      patientCode: data.patientCode,
      patientName: data.patientName,
      exams: data.exams,
      reason: data.reason,
      collectorId: data.collectorId,
      pendingBy: data.pendingBy,
      notifiedBy: data.notifiedBy,
      unitId,
    })
    updateTag('collections')
    revalidatePath('/collections')
    revalidatePath('/reports')
    return { success: true }
  } catch (error: unknown) {
    let message = 'Erro inesperado ao registrar a recoleta.'
    if (error && typeof error === 'object' && 'response' in error) {
      try {
        const e = await (error as any).response.clone().json()
        if (e.message) message = e.message
      } catch {}
    }
    return { success: false, message }
  }
}

export async function deleteCollection(id: string) {
  try {
    const { token } = await auth()
    await deleteCollectionActionApi(token, id)
    updateTag('collections')
    revalidatePath('/collections')
    revalidatePath('/reports')
    return { success: true }
  } catch (error: unknown) {
    return { success: false, message: 'Erro ao deletar recoleta.' }
  }
}

export async function updateCollection(
  id: string,
  data: {
    requestDate: string
    patientCode: string
    patientName: string
    exams: string[]
    reason: string
    collectorId: string
    pendingBy: string
    notifiedBy: string
  }
) {
  try {
    const { token } = await auth()
    await updateCollectionActionApi(token, id, data)
    updateTag('collections')
    revalidatePath('/collections')
    revalidatePath('/reports')
    return { success: true }
  } catch (error: unknown) {
    let message = 'Erro inesperado ao atualizar a recoleta.'
    if (error && typeof error === 'object' && 'response' in error) {
      try {
        const e = await (error as any).response.clone().json()
        if (e.message) message = e.message
      } catch {}
    }
    return { success: false, message }
  }
}
