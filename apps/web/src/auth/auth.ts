import { getProfile } from '@/http/get-profile'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function isAuthenticated() {
  const cookieStore = await cookies()
  return cookieStore.has('token')
}

export async function auth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/auth/sign-in')
  }

  try {
    const { user } = await getProfile(token)
    return { user, token }
  } catch {
    // Se o token for inválido/expirado
    redirect('/auth/sign-in')
  }
}
