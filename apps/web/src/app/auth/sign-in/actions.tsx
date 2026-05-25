'use server'

import { signIn } from '@/http/sign-in'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function SignIn(data: FormData) {
  const { username, password } = Object.fromEntries(data)

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
  } catch (err: any) {
    let errorMessage = 'Erro ao realizar login.'
    if (err.response) {
      // Caso o Ky retorne erro HTTP, tentar extrair a mensagem do body
      try {
        const errorData = await err.response.json()
        if (errorData.message) errorMessage = errorData.message
      } catch {}
    }
    return { success: false, message: errorMessage }
  }

  redirect('/')
}
