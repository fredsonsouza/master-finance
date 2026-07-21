import { auth } from '@/auth/auth'
import { getUnits } from '@/http/get-units'
import type { Unit } from '@/http/get-units'
import { ProfileButton } from './profile-button'
import { UnitSwitcher } from './unit-switcher'
import { getActiveUnit } from './unit-switcher-action'

export async function Header() {
  const { user, token } = await auth()

  let units: Unit[] = []
  if (
    user.role === 'ADMIN' ||
    user.role === 'MANAGER' ||
    user.role === 'INVENTORY'
  ) {
    try {
      const res = await getUnits(token)
      units = res.units
    } catch (error) {
      console.error('Failed to load units:', error)
    }
  }

  const activeUnitId = await getActiveUnit()

  return (
    <header className="border-surface-container bg-surface flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-4 ml-auto">
        {(user?.role === 'ADMIN' ||
          user?.role === 'MANAGER' ||
          user?.role === 'INVENTORY') && (
          <UnitSwitcher units={units} initialActiveUnitId={activeUnitId} />
        )}
        <ProfileButton user={user} />
      </div>
    </header>
  )
}
