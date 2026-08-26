'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signOutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('token')
  cookieStore.delete('activeUnit')
  redirect('/auth/sign-in')
}
