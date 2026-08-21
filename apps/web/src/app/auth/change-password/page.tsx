import { auth } from '@/auth/auth'
import { redirect } from 'next/navigation'
import { ChangePasswordForm } from './change-password-form'

export default async function ChangePasswordPage() {
  const { user } = await auth()

  if (!user.forcePasswordChange) {
    redirect('/')
  }

  return <ChangePasswordForm userName={user.name} username={user.username} />
}
