'use server'

import { auth } from '@/auth/auth'
import { updateProfile } from '@/http/update-profile'
import { updateTag } from 'next/cache'

export async function updateProfileAction(data: FormData) {
  const { token } = await auth()
  const name = data.get('name') as string

  try {
    await updateProfile(token, { name })
    updateTag('profile')
    return { success: true, message: null }
  } catch (err: unknown) {
    let msg = 'Erro ao atualizar perfil.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const e = await (err as any).response.clone().json()
        if (e?.message) msg = e.message
      } catch {}
    }
    return { success: false, message: msg }
  }
}
