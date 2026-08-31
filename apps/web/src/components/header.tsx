import { auth } from '@/auth/auth'
import { Building2 } from 'lucide-react'
import { ProfileButton } from './profile-button'

export async function Header() {
  const { user } = await auth()

  return (
    <header className="border-surface-container bg-surface flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-3">
        {user.unit?.name && (
          <div className="flex items-center gap-2 rounded-full bg-surface-container px-3.5 py-1.5 text-xs font-medium text-on-surface-variant">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span>{user.unit.name}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 ml-auto">
        <ProfileButton user={user} />
      </div>
    </header>
  )
}
