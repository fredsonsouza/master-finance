import { auth } from '@/auth/auth'
import { getSectors } from '@/http/get-sectors'
import type { Sector } from '@/http/get-sectors'
import { getUnits } from '@/http/get-units'
import type { Unit } from '@/http/get-units'
import { getUsers } from '@/http/get-users'
import type { User } from '@/http/get-users'
import { redirect } from 'next/navigation'
import { SettingsContent } from './settings-content'

import { getActiveUnit } from '@/components/unit-switcher-action'

export default async function SettingsPage() {
  const { token, user } = await auth()

  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    redirect('/')
  }

  const activeUnitId = await getActiveUnit()

  let units: Unit[] = []
  let sectors: Sector[] = []
  let users: User[] = []

  try {
    const [unitsRes, sectorsRes, usersRes] = await Promise.all([
      getUnits(token).catch(() => ({ units: [] })),
      getSectors(token).catch(() => ({ sectors: [] })),
      getUsers(token).catch(() => ({ users: [] })),
    ])
    units = unitsRes.units
    sectors = sectorsRes.sectors
    users = usersRes.users
  } catch (err) {
    console.error(err)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary">
          Configurações
        </h1>
        <p className="text-on-surface-variant">
          Gerenciamento administrativo da plataforma.
        </p>
      </div>

      <SettingsContent
        users={users}
        units={units}
        sectors={sectors}
        activeUnitId={activeUnitId}
        currentUserRole={user.role}
      />
    </div>
  )
}
