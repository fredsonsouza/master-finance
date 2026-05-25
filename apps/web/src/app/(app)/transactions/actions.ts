'use server'

import { createTransaction } from '@/http/create-transaction'
import { cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'

export async function createTransactionAction(data: FormData) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return { success: false, message: 'Não autenticado' }
  }

  const type = data.get('type') as 'ENTRY' | 'EXIT'
  const dateStr = data.get('date') as string
  const value = Number(data.get('value'))
  const quantity = Number(data.get('quantity'))
  const itemId = data.get('itemId') as string

  try {
    let dateIso: string | undefined = undefined
    if (dateStr) {
      // Garantir formato ISO 8601 (o Zod pede datetime)
      dateIso = new Date(dateStr).toISOString()
    }

    await createTransaction(token, {
      type,
      date: dateIso,
      value,
      quantity,
      itemId,
    })

    // Revalida a lista de transações para atualizar a tabela instantaneamente
    revalidateTag('transactions')
    
    return { success: true, message: null }
  } catch (err: any) {
    let errorMessage = 'Erro ao criar transação.'
    if (err.response) {
      try {
        const errorData = await err.response.json()
        if (errorData.message) errorMessage = errorData.message
      } catch {}
    }
    return { success: false, message: errorMessage }
  }
}
