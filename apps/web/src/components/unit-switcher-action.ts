'use server'

import { cookies } from 'next/headers'

export async function setActiveUnit(unitId: string | null) {
  const cookieStore = await cookies()

  if (unitId) {
    cookieStore.set('active-unit-id', unitId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
  } else {
    cookieStore.delete('active-unit-id')
  }
}

export async function getActiveUnit() {
  const cookieStore = await cookies()
  return cookieStore.get('active-unit-id')?.value || null
}
