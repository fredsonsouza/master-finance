'use server'

import { auth } from '@/auth/auth'
import { hasPermission } from '@/lib/permissions'

export async function getActiveUnit() {
  const { user } = await auth()
  if (hasPermission(user, 'scope:all_units')) {
    return null
  }
  return user.unitId || null
}
