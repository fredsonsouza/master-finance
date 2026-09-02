'use server'

import { auth } from '@/auth/auth'
import { createCategory } from '@/http/create-category'
import { createSector } from '@/http/create-sector'
import { createUnit } from '@/http/create-unit'
import { createUser } from '@/http/create-user'
import { deleteSector } from '@/http/delete-sector'
import { deleteUnit } from '@/http/delete-unit'
import { deleteUser } from '@/http/delete-user'
import { getUsers } from '@/http/get-users'
import { resetPassword } from '@/http/reset-password'
import { updateCategory } from '@/http/update-category'
import { updateSector } from '@/http/update-sector'
import { updateUnit } from '@/http/update-unit'
import { updateUser } from '@/http/update-user'
import { revalidatePath, updateTag } from 'next/cache'

export async function fetchUsersAction(params?: {
  unitId?: string | null
  role?: string | null
  search?: string | null
  page?: number
  perPage?: number
}) {
  const { token } = await auth()
  if (!token) return { success: false, data: null, message: 'Não autenticado' }

  try {
    const data = await getUsers(
      token,
      params?.unitId,
      params?.role,
      params?.search,
      params?.page,
      params?.perPage
    )
    return { success: true, data, message: null }
  } catch (err: unknown) {
    return { success: false, data: null, message: 'Erro ao buscar usuários.' }
  }
}

export async function createUnitAction(data: FormData) {
  const { token } = await auth()
  const name = data.get('name') as string

  try {
    await createUnit(token, { name })
    revalidatePath('/settings')
    return { success: true, message: null }
  } catch (err: unknown) {
    return { success: false, message: 'Erro ao criar unidade.' }
  }
}

export async function createSectorAction(data: FormData) {
  const { token } = await auth()
  const name = data.get('name') as string

  try {
    await createSector(token, { name })
    revalidatePath('/settings')
    return { success: true, message: null }
  } catch (err: unknown) {
    return { success: false, message: 'Erro ao criar setor.' }
  }
}

export async function createUserAction(data: FormData) {
  const { token } = await auth()
  const name = data.get('name') as string
  const username = data.get('username') as string
  const password = data.get('password') as string
  const role = data.get('role') as
    | 'ADMIN'
    | 'MANAGER'
    | 'EMPLOYEE'
    | 'FINANCIAL'
    | 'SELLER'
    | 'COLLECTOR'
    | 'FISCAL'
    | 'INVENTORY'
    | 'ANALYST'
  const unitId = data.get('unitId') as string | null

  try {
    await createUser(token, {
      name,
      username,
      password,
      role,
      unitId: unitId || null,
    })
    updateTag('users')
    revalidatePath('/settings')
    revalidatePath('/evaluations')
    revalidatePath('/cash-closures')
    revalidatePath('/collections')
    return { success: true, message: null }
  } catch (err: unknown) {
    console.error('Exception in createUserAction:', err)
    let msg = 'Erro ao criar usuário.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const response = (err as any).response
        const e = await response.json()
        if (e?.message) msg = e.message
      } catch (parseErr) {}
    }
    return { success: false, message: msg }
  }
}

export async function deleteUnitAction(id: string) {
  const { token } = await auth()
  try {
    await deleteUnit(token, id)
    updateTag('units')
    revalidatePath('/settings')
    revalidatePath('/evaluations')
    revalidatePath('/cash-closures')
    revalidatePath('/collections')
    revalidatePath('/transactions')
    return { success: true, message: null }
  } catch (err) {
    return { success: false, message: 'Erro ao excluir unidade.' }
  }
}

export async function updateUnitAction(id: string, data: FormData) {
  const { token } = await auth()
  const name = data.get('name') as string
  try {
    await updateUnit(token, id, { name })
    updateTag('units')
    revalidatePath('/settings')
    revalidatePath('/evaluations')
    revalidatePath('/cash-closures')
    revalidatePath('/collections')
    revalidatePath('/transactions')
    return { success: true, message: null }
  } catch (err) {
    return { success: false, message: 'Erro ao atualizar unidade.' }
  }
}

export async function deleteSectorAction(id: string) {
  const { token } = await auth()
  try {
    await deleteSector(token, id)
    updateTag('sectors')
    revalidatePath('/settings')
    revalidatePath('/transactions')
    return { success: true, message: null }
  } catch (err) {
    return { success: false, message: 'Erro ao excluir setor.' }
  }
}

export async function updateSectorAction(id: string, data: FormData) {
  const { token } = await auth()
  const name = data.get('name') as string
  try {
    await updateSector(token, id, { name })
    updateTag('sectors')
    revalidatePath('/settings')
    revalidatePath('/transactions')
    return { success: true, message: null }
  } catch (err) {
    return { success: false, message: 'Erro ao atualizar setor.' }
  }
}

export async function deleteUserAction(id: string) {
  const { token } = await auth()
  try {
    await deleteUser(token, id)
    updateTag('users')
    revalidatePath('/settings')
    revalidatePath('/evaluations')
    revalidatePath('/cash-closures')
    revalidatePath('/collections')
    return { success: true, message: null }
  } catch (err: unknown) {
    let msg = 'Erro ao excluir usuário.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const e = await (err as any).response.clone().json()
        if (e?.message) msg = e.message
      } catch {}
    }
    return { success: false, message: msg }
  }
}

export async function updateUserAction(id: string, data: FormData) {
  const { token } = await auth()
  const name = data.get('name') as string
  const password = data.get('password') as string | undefined
  const role = data.get('role') as
    | 'ADMIN'
    | 'MANAGER'
    | 'EMPLOYEE'
    | 'FINANCIAL'
    | 'SELLER'
    | 'COLLECTOR'
    | 'FISCAL'
    | 'INVENTORY'
    | 'ANALYST'
  const unitId = data.get('unitId') as string | null

  try {
    await updateUser(token, id, {
      name: name || undefined,
      role: role || undefined,
      unitId: unitId || null,
      password:
        password && password.trim().length > 0 ? password.trim() : undefined,
    })
    updateTag('users')
    revalidatePath('/settings')
    revalidatePath('/evaluations')
    revalidatePath('/cash-closures')
    revalidatePath('/collections')
    return { success: true, message: null }
  } catch (err: unknown) {
    let msg = 'Erro ao atualizar usuário.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const e = await (err as any).response.clone().json()
        if (e?.message) msg = e.message
      } catch {}
    }
    return { success: false, message: msg }
  }
}

export async function resetUserPasswordAction(
  userId: string,
  customPassword?: string
) {
  const { token } = await auth()
  if (!token) return { success: false, temporaryPassword: null, message: 'Não autenticado' }

  try {
    const res = await resetPassword(token, userId, {
      password:
        customPassword && customPassword.trim().length > 0
          ? customPassword.trim()
          : undefined,
    })
    revalidatePath('/settings')
    return { success: true, temporaryPassword: res.temporaryPassword, message: null }
  } catch (err: unknown) {
    let msg = 'Erro ao redefinir senha do usuário.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const e = await (err as any).response.clone().json()
        if (e?.message) msg = e.message
      } catch {}
    }
    return { success: false, temporaryPassword: null, message: msg }
  }
}

export async function createCategoryAction(data: FormData) {
  const { token } = await auth()
  const name = data.get('name') as string

  try {
    await createCategory(token, { name })
    revalidatePath('/settings')
    revalidatePath('/items')
    return { success: true, message: null }
  } catch (err: unknown) {
    let msg = 'Erro ao criar categoria.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const e = await (err as any).response.clone().json()
        if (e?.message) msg = e.message
      } catch {}
    }
    return { success: false, message: msg }
  }
}

export async function updateCategoryAction(id: string, data: FormData) {
  const { token } = await auth()
  const name = data.get('name') as string

  try {
    await updateCategory(token, id, { name })
    revalidatePath('/settings')
    revalidatePath('/items')
    return { success: true, message: null }
  } catch (err: unknown) {
    let msg = 'Erro ao editar categoria.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const e = await (err as any).response.clone().json()
        if (e?.message) msg = e.message
      } catch {}
    }
    return { success: false, message: msg }
  }
}
