'use server'

import { auth } from '@/auth/auth'
import { updatePassword } from '@/http/update-password'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function changePasswordAction(data: FormData) {
  const { token } = await auth()
  const password = data.get('password') as string
  const confirmPassword = data.get('confirmPassword') as string

  if (!password || password.trim().length < 4) {
    return {
      success: false,
      message: 'A nova senha deve ter no mínimo 4 caracteres.',
    }
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      message: 'As senhas digitadas não coincidem.',
    }
  }

  try {
    await updatePassword(token, { password: password.trim() })
    revalidatePath('/', 'layout')
  } catch (err: unknown) {
    let errorMessage = 'Erro ao alterar a senha. Tente novamente.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const response = (err as any).response
        const errorData = await response.json()
        if (errorData.message) errorMessage = errorData.message
      } catch {}
    }
    return { success: false, message: errorMessage }
  }

  redirect('/')
}
