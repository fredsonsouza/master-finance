import { auth } from '@/auth/auth'
import { getActiveUnit } from '@/components/unit-switcher-action'
import { getCashClosures } from '@/http/cash-closures'
import type { CashClosure, CashClosurePagination } from '@/http/cash-closures'
import { getSectors } from '@/http/get-sectors'
import type { Sector } from '@/http/get-sectors'
import { getUnits } from '@/http/get-units'
import type { Unit } from '@/http/get-units'
import { getUsers } from '@/http/get-users'
import type { User } from '@/http/get-users'
import {
  getDefaultHomeRoute,
  hasAnyPermission,
  hasPermission,
} from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { CashClosuresContent } from './cash-closures-content'

export const dynamic = 'force-dynamic'

export default async function CashClosuresPage() {
  const { user, token } = await auth()

  if (
    !hasAnyPermission(user, ['cash_closures:create', 'cash_closures:manage'])
  ) {
    redirect(getDefaultHomeRoute(user))
  }

  const canManageCashClosures = hasPermission(user, 'cash_closures:manage')
  const hasAllUnits = hasPermission(user, 'scope:all_units')
  const activeUnitId = await getActiveUnit()

  let closures: CashClosure[] = []
  let pagination: CashClosurePagination = {
    page: 1,
    perPage: 20,
    totalCount: 0,
    totalPages: 1,
  }
  let sectors: Sector[] = []
  let units: Unit[] = []
  let users: User[] = []

  try {
    const res = await getCashClosures(token, {
      unitId: activeUnitId,
      page: 1,
      perPage: 20,
    })
    closures = res.closures
    pagination = res.pagination

    if (activeUnitId) {
      const sRes = await getSectors(token).catch(() => ({ sectors: [] }))
      sectors = sRes.sectors
    }

    if (canManageCashClosures || hasAllUnits) {
      const uRes = await getUnits(token).catch(() => ({ units: [] }))
      units = uRes.units
    }

    if (canManageCashClosures) {
      const usersRes = await getUsers(token, activeUnitId, null, null, 1, 200, {
        onlyActive: true,
      }).catch(() => ({ users: [] }))
      users = usersRes.users
    }
  } catch (error) {
    console.error('Failed to load cash closures data', error)
  }

  return (
    <CashClosuresContent
      initialClosures={closures}
      initialPagination={pagination}
      sectors={sectors}
      units={units}
      users={users}
      canManageCashClosures={canManageCashClosures}
      userId={user.id}
      activeUnitId={activeUnitId}
    />
  )
}
