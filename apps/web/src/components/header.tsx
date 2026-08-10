import { auth } from '@/auth/auth'
import { ProfileButton } from './profile-button'

export async function Header() {
  const { user } = await auth()

  return (
    <header className="border-surface-container bg-surface flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-4 ml-auto">
        <ProfileButton user={user} />
      </div>
    </header>
  )
}
