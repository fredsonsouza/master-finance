'use server'

import { auth } from '@/auth/auth'

export async function getActiveUnit() {
  const { user } = await auth()
  return user.unitId || null
}
