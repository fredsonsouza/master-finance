'use server'

import { auth } from '@/auth/auth'
import { createItem } from '@/http/create-item'
import { getItems } from '@/http/get-items'
import { updateItem } from '@/http/update-item'
import { revalidatePath } from 'next/cache'

export async function fetchItemsAction(params?: {
  search?: string | null
  sectorId?: string | null
  page?: number
  perPage?: number
}) {
  const { token } = await auth()
  if (!token) return { success: false, data: null, message: 'Não autenticado' }

  try {
    const data = await getItems(token, params)
    return { success: true, data, message: null }
  } catch (err: unknown) {
    return { success: false, data: null, message: 'Erro ao buscar itens.' }
  }
}

export async function createItemAction(data: FormData) {
  const { token } = await auth()

  if (!token) {
    return { success: false, message: 'Não autenticado' }
  }

  const name = data.get('name') as string
  const description = data.get('description') as string | undefined
  const rawSectorId = data.get('sectorId') as string | undefined
  const sectorId = rawSectorId === '' ? undefined : rawSectorId
  const quantity = data.get('quantity') as string | undefined

  try {
    await createItem(token, {
      name,
      description,
      sectorId,
      quantity: quantity ? Number(quantity) : 0,
    })

    revalidatePath('/items')

    return { success: true, message: null }
  } catch (err: unknown) {
    let errorMessage = 'Erro ao criar item no catálogo.'
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

export async function updateItemAction(data: FormData) {
  const { token } = await auth()

  if (!token) {
    return { success: false, message: 'Não autenticado' }
  }

  const id = data.get('id') as string
  const name = data.get('name') as string
  const description = data.get('description') as string | undefined
  const rawSectorId = data.get('sectorId') as string | undefined
  const sectorId = rawSectorId === '' ? null : rawSectorId
  const quantity = data.get('quantity') as string | undefined

  try {
    await updateItem(token, {
      id,
      name,
      description,
      sectorId,
      quantity: quantity ? Number(quantity) : undefined,
    })

    revalidatePath('/items')

    return { success: true, message: null }
  } catch (err: unknown) {
    let errorMessage = 'Erro ao atualizar item no catálogo.'
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
