import { auth } from '@/auth/auth'
import { getUnits } from '@/http/get-units'
import { Building2 } from 'lucide-react'
import { cookies } from 'next/headers'
import { ProfileButton } from './profile-button'
import { UnitSwitcher } from './unit-switcher'
import { getActiveUnit } from './unit-switcher-action'

export async function Header() {
  const { user } = await auth()
  const isGlobalRole =
    user.role === 'ADMIN' ||
    user.role === 'MANAGER' ||
    user.role === 'FINANCIAL'

  let units: any[] = []
  let activeUnitId: string | null = null

  if (isGlobalRole) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (token) {
      try {
        const response = await getUnits(token)
        units = response.units
      } catch {}
    }
    activeUnitId = await getActiveUnit()
  }

  return (
    <header className="border-surface-container bg-surface flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-3">
        {isGlobalRole ? (
          <UnitSwitcher units={units} initialActiveUnitId={activeUnitId} />
        ) : (
          <div className="flex items-center gap-2 rounded-full bg-surface-container px-3.5 py-1.5 text-xs font-medium text-on-surface-variant">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span>{user.unit?.name || 'Unidade Local'}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 ml-auto">
        <ProfileButton user={user} />
      </div>
    </header>
  )
}
