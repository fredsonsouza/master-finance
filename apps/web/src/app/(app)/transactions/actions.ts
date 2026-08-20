'use server'

import { createTransaction } from '@/http/create-transaction'
import { updateTag } from 'next/cache'
import { cookies } from 'next/headers'

import { auth } from '@/auth/auth'
import { getActiveUnit } from '@/components/unit-switcher-action'

export async function createTransactionAction(data: FormData) {
  const { token, user } = await auth()

  if (!token) {
    return { success: false, message: 'Não autenticado' }
  }

  let unitId = user.unitId
  if (
    user.role === 'ADMIN' ||
    user.role === 'MANAGER' ||
    user.role === 'INVENTORY'
  ) {
    const selectedUnitId = data.get('unitId') as string
    if (selectedUnitId) {
      unitId = selectedUnitId
    } else {
      const activeUnit = await getActiveUnit()
      if (activeUnit) {
        unitId = activeUnit
      }
    }
  }

  if (!unitId) {
    return {
      success: false,
      message:
        'Selecione uma unidade para registrar transações.',
    }
  }

  const type = data.get('type') as 'ENTRY' | 'EXIT'
  const rawSectorId = data.get('sectorId') as string | undefined
  const sectorId = rawSectorId ? rawSectorId : undefined

  if (type === 'EXIT' && !sectorId) {
    return {
      success: false,
      message: 'Selecione um setor de destino para registrar a saída.',
    }
  }

  const dateStr = data.get('date') as string
  const itemsJson = data.get('itemsJson') as string

  if (!itemsJson) {
    return { success: false, message: 'Nenhum item adicionado à transação.' }
  }

  let items: { itemId: string; quantity: number; unitValue: number }[] = []
  try {
    items = JSON.parse(itemsJson)
  } catch (err) {
    return { success: false, message: 'Formato de itens inválido.' }
  }

  if (items.length === 0) {
    return { success: false, message: 'Adicione pelo menos um item.' }
  }

  try {
    let dateIso: string | undefined = undefined
    if (dateStr) {
      dateIso = new Date(`${dateStr}T12:00:00Z`).toISOString()
    } else {
      dateIso = new Date().toISOString()
    }

    const payloadItems = items.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      value: item.unitValue,
    }))

    await createTransaction(token, {
      type,
      date: dateIso,
      unitId,
      sectorId: sectorId || null,
      items: payloadItems,
    })

    updateTag('transactions')

    return { success: true, message: null }
  } catch (err: unknown) {
    let errorMessage = 'Erro ao criar transação.'
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

export async function deleteTransactionAction(id: string) {
  const { token } = await auth()

  if (!token) {
    return { success: false, message: 'Não autenticado' }
  }

  try {
    const { deleteTransaction } = await import('@/http/delete-transaction')
    await deleteTransaction(token, id)
    updateTag('transactions')
    return { success: true, message: null }
  } catch (err: unknown) {
    return { success: false, message: 'Erro ao excluir transação.' }
  }
}

export async function updateTransactionAction(id: string, data: FormData) {
  const { token } = await auth()

  if (!token) {
    return { success: false, message: 'Não autenticado' }
  }

  const type = data.get('type') as 'ENTRY' | 'EXIT'
  const rawValue = data.get('value') as string
  const rawQuantity = data.get('quantity') as string
  const rawSectorId = data.get('sectorId') as string
  const dateStr = data.get('date') as string

  const value = rawValue
    ? Number(rawValue.replace(/\D/g, '')) / 100
    : undefined
  const quantity = rawQuantity ? Number(rawQuantity) : undefined
  const sectorId = rawSectorId ? rawSectorId : undefined

  try {
    let dateIso: string | undefined = undefined
    if (dateStr) {
      dateIso = new Date(`${dateStr}T12:00:00Z`).toISOString()
    }

    const { updateTransaction } = await import('@/http/update-transaction')
    await updateTransaction(token, id, {
      type,
      value,
      quantity,
      sectorId,
      date: dateIso,
    })

    updateTag('transactions')
    return { success: true, message: null }
  } catch (err: unknown) {
    let errorMessage = 'Erro ao atualizar transação.'
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

export async function getItemMetricsAction(itemId: string, unitId?: string) {
  const { token } = await auth()
  if (!token) return null

  try {
    const { getItemMetrics } = await import('@/http/get-item-metrics')
    const res = await getItemMetrics(token, itemId, unitId)
    return res
  } catch (err) {
    return null
  }
}
