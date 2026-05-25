'use server'

import { createItem } from '@/http/create-item'
import { auth } from '@/auth/auth'
import { revalidateTag } from 'next/cache'

export async function createItemAction(data: FormData) {
  const { token, user } = await auth()

  if (!token) {
    return { success: false, message: 'Não autenticado' }
  }

  const name = data.get('name') as string
  const description = data.get('description') as string | undefined
  const unitId = user.unitId

  if (!unitId) {
    return { success: false, message: 'Usuário não vinculado a nenhuma unidade. Ação bloqueada.' }
  }

  try {
    await createItem(token, {
      name,
      description,
      unitId,
    })

    revalidateTag('items')
    
    return { success: true, message: null }
  } catch (err: any) {
    let errorMessage = 'Erro ao criar item no catálogo.'
    if (err.response) {
      try {
        const errorData = await err.response.json()
        if (errorData.message) errorMessage = errorData.message
      } catch {}
    }
    return { success: false, message: errorMessage }
  }
}
