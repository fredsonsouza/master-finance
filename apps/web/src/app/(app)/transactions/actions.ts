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

  const sectorId = data.get('sectorId') as string
  if (!sectorId) {
    return {
      success: false,
      message: 'Selecione um setor para registrar as transações.',
    }
  }

  const type = data.get('type') as 'ENTRY' | 'EXIT'
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
      sectorId,
      items: payloadItems,
    })

    updateTag('transactions')

    return { success: true, message: null }
  } catch (err: unknown) {
    let errorMessage = 'Erro ao criar transação.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const response = (err as any).response
        const errorData = await response.clone().json()
        if (errorData.message) errorMessage = errorData.message
      } catch {}
    }
    return { success: false, message: errorMessage }
  }
}

import { deleteTransaction } from '@/http/delete-transaction'
import { updateTransaction } from '@/http/update-transaction'

export async function deleteTransactionAction(id: string) {
  const { token } = await auth()
  if (!token) return { success: false, message: 'Não autenticado' }

  try {
    await deleteTransaction(token, id)
    updateTag('transactions')
    return { success: true, message: null }
  } catch (err: unknown) {
    return { success: false, message: 'Erro ao excluir transação.' }
  }
}

export async function updateTransactionAction(id: string, data: FormData) {
  const { token } = await auth()
  if (!token) return { success: false, message: 'Não autenticado' }

  const type = data.get('type') as 'ENTRY' | 'EXIT' | null
  const dateStr = data.get('date') as string | null
  const rawValue = data.get('value') as string | null
  const value = rawValue ? Number(rawValue) / 100 : undefined

  const rawQuantity = data.get('quantity')
  const quantity = rawQuantity ? Number(rawQuantity) : undefined

  const itemId = data.get('itemId') as string | null
  const sectorId = data.get('sectorId') as string | null

  try {
    let dateIso: string | undefined = undefined
    if (dateStr) {
      dateIso = new Date(`${dateStr}T12:00:00Z`).toISOString()
    }

    await updateTransaction(token, id, {
      type: type || undefined,
      date: dateIso,
      value,
      quantity,
      itemId: itemId || undefined,
      sectorId: sectorId || undefined,
    })

    updateTag('transactions')
    return { success: true, message: null }
  } catch (err: unknown) {
    let errorMessage = 'Erro ao atualizar transação.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const response = (err as any).response
        const errorData = await response.clone().json()
        if (errorData.message) errorMessage = errorData.message
      } catch {}
    }
    return { success: false, message: errorMessage }
  }
}

import { getItemMetrics } from '@/http/get-item-metrics'

export async function getItemMetricsAction(itemId: string, unitId?: string | null) {
  const { token } = await auth()
  if (!token) return null

  try {
    const data = await getItemMetrics(token, itemId, unitId)
    return data
  } catch (err) {
    return null
  }
}
