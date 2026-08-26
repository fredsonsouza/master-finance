'use server'

import { auth } from '@/auth/auth'
import { cookies } from 'next/headers'

export async function setActiveUnit(unitId: string | null) {
  const { user } = await auth()
  const cookieStore = await cookies()

  // Se o usuário tem perfil local e unidade fixa, força o escopo de sua unidade
  if (
    user.role !== 'ADMIN' &&
    user.role !== 'MANAGER' &&
    user.role !== 'FINANCIAL'
  ) {
    if (user.unitId) {
      cookieStore.set('active-unit-id', user.unitId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
      return
    }
  }

  if (unitId) {
    cookieStore.set('active-unit-id', unitId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  } else {
    cookieStore.delete('active-unit-id')
  }
}

export async function getActiveUnit() {
  const { user } = await auth()
  if (
    user.role !== 'ADMIN' &&
    user.role !== 'MANAGER' &&
    user.role !== 'FINANCIAL'
  ) {
    return user.unitId || null
  }

  const cookieStore = await cookies()
  return cookieStore.get('active-unit-id')?.value || null
}
