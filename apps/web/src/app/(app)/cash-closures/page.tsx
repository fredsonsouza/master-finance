import { auth } from '@/auth/auth'
import { getActiveUnit } from '@/components/unit-switcher-action'
import { getCashClosures } from '@/http/cash-closures'
import type { CashClosure } from '@/http/cash-closures'
import { getSectors } from '@/http/get-sectors'
import type { Sector } from '@/http/get-sectors'
import { getUnits } from '@/http/get-units'
import type { Unit } from '@/http/get-units'
import { getUsers } from '@/http/get-users'
import type { User } from '@/http/get-users'
import { redirect } from 'next/navigation'
import { CashClosuresContent } from './cash-closures-content'

export default async function CashClosuresPage() {
  const { user, token } = await auth()

  if (!['ADMIN', 'MANAGER', 'FINANCIAL', 'SELLER'].includes(user.role)) {
    redirect('/')
  }

  const activeUnitId = await getActiveUnit()

  let closures: CashClosure[] = []
  let sectors: Sector[] = []
  let units: Unit[] = []
  let users: User[] = []

  try {
    const res = await getCashClosures(token, activeUnitId)
    closures = res.closures

    if (activeUnitId) {
      const sRes = await getSectors(token)
      sectors = sRes.sectors
    }

    if (user.role !== 'SELLER' && user.role !== 'EMPLOYEE') {
      const uRes = await getUnits(token)
      units = uRes.units

      const usersRes = await getUsers(token, activeUnitId)
      users = usersRes.users
    }
  } catch (error) {
    console.error('Failed to load cash closures data', error)
  }

  return (
    <CashClosuresContent
      initialClosures={closures}
      sectors={sectors}
      units={units}
      users={users}
      userRole={user.role}
      userId={user.id}
      activeUnitId={activeUnitId}
    />
  )
}
