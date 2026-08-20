'use server'

import { auth } from '@/auth/auth'
import { createCategory } from '@/http/create-category'
import { createItem } from '@/http/create-item'
import { getItems } from '@/http/get-items'
import { updateItem } from '@/http/update-item'
import { revalidatePath } from 'next/cache'

export async function fetchItemsAction(params?: {
  search?: string | null
  categoryId?: string | null
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

export async function createCategoryAction(name: string) {
  const { token } = await auth()
  if (!token) return { success: false, category: null, message: 'Não autenticado' }

  try {
    const res = await createCategory(token, { name })
    revalidatePath('/items')
    return { success: true, category: res.category, message: null }
  } catch (err: unknown) {
    let errorMessage = 'Erro ao criar categoria.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const response = (err as { response: Response }).response
        const errorData = await response.json()
        if (errorData.message) errorMessage = errorData.message
      } catch {}
    }
    return { success: false, category: null, message: errorMessage }
  }
}

export async function createItemAction(data: FormData) {
  const { token } = await auth()

  if (!token) {
    return { success: false, message: 'Não autenticado' }
  }

  const name = data.get('name') as string
  const description = data.get('description') as string | undefined
  const rawCategoryId = data.get('categoryId') as string | undefined
  const categoryId = rawCategoryId === '' ? undefined : rawCategoryId
  const quantity = data.get('quantity') as string | undefined

  try {
    await createItem(token, {
      name,
      description,
      categoryId,
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
  const rawCategoryId = data.get('categoryId') as string | undefined
  const categoryId = rawCategoryId === '' ? null : rawCategoryId
  const quantity = data.get('quantity') as string | undefined

  try {
    await updateItem(token, {
      id,
      name,
      description,
      categoryId,
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
