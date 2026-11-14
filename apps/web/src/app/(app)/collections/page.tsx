import { auth } from '@/auth/auth'
import { getActiveUnit } from '@/components/unit-switcher-action'
import { type Collection, getCollections } from '@/http/collections'
import { type Unit, getUnits } from '@/http/get-units'
import { type User, getUsers } from '@/http/get-users'
import { redirect } from 'next/navigation'
import { CollectionsContent } from './collections-content'

export const dynamic = 'force-dynamic'

export default async function CollectionsPage() {
  const { user, token } = await auth()

  if (
    user.role !== 'ADMIN' &&
    user.role !== 'MANAGER' &&
    user.role !== 'HR' &&
    user.role !== 'EMPLOYEE' &&
    user.role !== 'FISCAL' &&
    user.role !== 'COLLECTOR'
  ) {
    redirect('/')
  }

  const activeUnitId = await getActiveUnit()

  let collections: Collection[] = []
  let collectors: User[] = []
  let units: Unit[] = []

  const isGlobalUser =
    user.role === 'ADMIN' ||
    user.role === 'MANAGER' ||
    user.role === 'HR' ||
    user.role === 'FISCAL'

  try {
    if (activeUnitId || isGlobalUser || user.role === 'COLLECTOR') {
      const collectionsUnitId = isGlobalUser ? null : activeUnitId
      const [collectionsRes, usersRes, unitsRes] = await Promise.all([
        getCollections(token, collectionsUnitId).catch(() => ({
          collections: [],
        })),
        user.role !== 'COLLECTOR'
          ? getUsers(token, null, 'COLLECTOR', null, 1, 200).catch(() => ({
              users: [],
            }))
          : Promise.resolve({ users: [] }),
        isGlobalUser
          ? getUnits(token).catch(() => ({ units: [] }))
          : Promise.resolve({ units: [] }),
      ])

      collections = collectionsRes.collections || []
      collectors = usersRes.users || []
      units = unitsRes.units || []
    }
  } catch (err) {
    console.error(err)
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">
            Recoletas
          </h1>
          <p className="text-on-surface-variant">
            Gerencie solicitações de recoletas de exames pendentes
          </p>
        </div>
      </div>

      {!activeUnitId && !isGlobalUser && user.role !== 'COLLECTOR' ? (
        <div className="text-center py-12 text-on-surface-variant">
          Selecione uma unidade no menu superior para visualizar as recoletas.
        </div>
      ) : (
        <CollectionsContent
          initialData={collections}
          activeUnitId={activeUnitId}
          collectors={collectors}
          units={units}
          currentUserRole={user.role}
        />
      )}
    </div>
  )
}
