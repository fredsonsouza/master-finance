'use server'

import { createUnit } from '@/http/create-unit'
import { createSector } from '@/http/create-sector'
import { createUser } from '@/http/create-user'
import { auth } from '@/auth/auth'
import { revalidateTag } from 'next/cache'

export async function createUnitAction(data: FormData) {
  const { token } = await auth()
  const name = data.get('name') as string

  try {
    await createUnit(token, { name })
    revalidateTag('units')
    return { success: true, message: null }
  } catch (err: any) {
    return { success: false, message: 'Erro ao criar unidade.' }
  }
}

export async function createSectorAction(data: FormData) {
  const { token } = await auth()
  const name = data.get('name') as string
  const unitId = data.get('unitId') as string

  try {
    await createSector(token, { name, unitId })
    revalidateTag('sectors')
    return { success: true, message: null }
  } catch (err: any) {
    return { success: false, message: 'Erro ao criar setor.' }
  }
}

export async function createUserAction(data: FormData) {
  const { token } = await auth()
  const name = data.get('name') as string
  const username = data.get('username') as string
  const password = data.get('password') as string
  const role = data.get('role') as 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  const unitId = data.get('unitId') as string | null

  try {
    await createUser(token, {
      name,
      username,
      password,
      role,
      unitId: unitId || null,
    })
    revalidateTag('users')
    return { success: true, message: null }
  } catch (err: any) {
    let msg = 'Erro ao criar usuário.'
    try {
      const e = await err.response?.json()
      if (e?.message) msg = e.message
    } catch {}
    return { success: false, message: msg }
  }
}
