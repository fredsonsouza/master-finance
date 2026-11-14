'use server'

import { auth } from '@/auth/auth'

export async function getActiveUnit() {
  const { user } = await auth()
  if (
    user.role === 'ADMIN' ||
    user.role === 'MANAGER' ||
    user.role === 'FINANCIAL' ||
    user.role === 'FISCAL' ||
    user.role === 'HR'
  ) {
    return null
  }
  return user.unitId || null
}
