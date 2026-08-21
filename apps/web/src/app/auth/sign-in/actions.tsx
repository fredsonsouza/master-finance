/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { getProfile } from '@/http/get-profile'
import { signIn } from '@/http/sign-in'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function SignIn(data: FormData) {
  const { username, password } = Object.fromEntries(data)

  let shouldForceChange = false

  try {
    const { token } = await signIn({
      username: String(username),
      password: String(password),
    })

    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
    })

    try {
      const { user } = await getProfile(token)
      if (user.forcePasswordChange) {
        shouldForceChange = true
      }
    } catch {}
  } catch (err: unknown) {
    let errorMessage = 'Erro ao realizar login.'
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as any).response
      try {
        const errorData = await response.json()
        if (errorData.message) errorMessage = errorData.message
      } catch {}
    }
    return { success: false, message: errorMessage }
  }

  if (shouldForceChange) {
    redirect('/auth/change-password')
  }

  redirect('/')
}
