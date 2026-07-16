'use server'

import { auth } from '@/auth/auth'
import { createItem } from '@/http/create-item'
import { revalidatePath } from 'next/cache'

import { getActiveUnit } from '@/components/unit-switcher-action'

export async function createItemAction(data: FormData) {
  const { token } = await auth()

  if (!token) {
    return { success: false, message: 'Não autenticado' }
  }

  const unitId = (data.get('unitId') as string) || (await getActiveUnit())

  if (!unitId) {
    return {
      success: false,
      message:
        'Selecione uma unidade no formulário ou no switcher para registrar itens.',
    }
  }

  const name = data.get('name') as string
  const description = data.get('description') as string | undefined
  const rawSectorId = data.get('sectorId') as string | undefined
  const sectorId = rawSectorId === '' ? undefined : rawSectorId

  try {
    await createItem(token, {
      name,
      description,
      unitId,
      sectorId,
    })

    revalidatePath('/items')

    return { success: true, message: null }
  } catch (err: unknown) {
    let errorMessage = 'Erro ao criar item no catálogo.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const response = (err as { response: Response }).response
        const errorData = await response.clone().json()
        if (errorData.message) errorMessage = errorData.message
      } catch {}
    }
    return { success: false, message: errorMessage }
  }
}
