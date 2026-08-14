import { auth } from '@/auth/auth'
import { getSectors, type Sector } from '@/http/get-sectors'
import { getUnits, type Unit } from '@/http/get-units'
import { getUsers, type User, type UserPagination } from '@/http/get-users'
import { redirect } from 'next/navigation'
import { SettingsContent } from './settings-content'

import { getActiveUnit } from '@/components/unit-switcher-action'

export default async function SettingsPage() {
  const { token, user } = await auth()

  if (
    user.role !== 'ADMIN' &&
    user.role !== 'MANAGER' &&
    user.role !== 'INVENTORY'
  ) {
    redirect('/')
  }

  const activeUnitId = await getActiveUnit()

  let units: Unit[] = []
  let sectors: Sector[] = []
  let users: User[] = []
  let userPagination: UserPagination = {
    page: 1,
    perPage: 20,
    totalCount: 0,
    totalPages: 1,
  }

  try {
    const [unitsRes, sectorsRes, usersRes] = await Promise.all([
      getUnits(token).catch(() => ({ units: [] })),
      getSectors(token).catch(() => ({ sectors: [] })),
      getUsers(token, null, null, null, 1, 20).catch(() => ({
        users: [],
        pagination: { page: 1, perPage: 20, totalCount: 0, totalPages: 1 },
      })),
    ])
    units = unitsRes.units
    sectors = sectorsRes.sectors
    users = usersRes.users
    if (usersRes.pagination) {
      userPagination = usersRes.pagination
    }
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
        userPagination={userPagination}
        units={units}
        sectors={sectors}
        activeUnitId={activeUnitId}
        currentUserRole={user.role}
      />
    </div>
  )
}
