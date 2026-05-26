import { auth } from '@/auth/auth'
import { UnitSwitcher } from './unit-switcher'
import { getUnits } from '@/http/get-units'
import { getActiveUnit } from './unit-switcher-action'

export async function Header() {
  const { user, token } = await auth()

  let units: any[] = []
  if (user.role === 'ADMIN' || user.role === 'MANAGER') {
    try {
      const res = await getUnits(token)
      units = res.units
    } catch {}
  }

  const activeUnitId = await getActiveUnit()

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-container bg-surface px-6">
      <div className="flex items-center gap-4">
        {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
          <UnitSwitcher units={units} initialActiveUnitId={activeUnitId} />
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-on-surface">{user.name || user.username}</p>
          <p className="text-xs text-on-surface-variant">{user.role}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
          {(user.name || user.username || 'U').charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
