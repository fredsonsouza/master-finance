import { auth } from '@/auth/auth'
import { getActiveUnit } from '@/components/unit-switcher-action'
import { type Department, getDepartments } from '@/http/departments'
import { type Category, getCategories } from '@/http/get-categories'
import { type Sector, getSectors } from '@/http/get-sectors'
import { type Unit, getUnits } from '@/http/get-units'
import { type User, type UserPagination, getUsers } from '@/http/get-users'
import {
  getDefaultHomeRoute,
  hasAnyPermission,
  hasPermission,
} from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { SettingsContent } from './settings-content'

export default async function SettingsPage() {
  const { token, user } = await auth()

  const canManageUsers = hasPermission(user, 'users:manage')
  const canManageStructure = hasPermission(user, 'settings:structure')
  const canManageDepartments = hasAnyPermission(user, [
    'employees:manage',
    'settings:structure',
  ])

  if (!canManageUsers && !canManageStructure && !canManageDepartments) {
    redirect(getDefaultHomeRoute(user))
  }

  const activeUnitId = await getActiveUnit()

  let units: Unit[] = []
  let sectors: Sector[] = []
  let departments: Department[] = []
  let categories: Category[] = []
  let users: User[] = []
  let userPagination: UserPagination = {
    page: 1,
    perPage: 20,
    totalCount: 0,
    totalPages: 1,
  }

  try {
    const [unitsRes, sectorsRes, departmentsRes, categoriesRes, usersRes] =
      await Promise.all([
        getUnits(token).catch(() => ({ units: [] })),
        canManageStructure
          ? getSectors(token).catch(() => ({ sectors: [] }))
          : Promise.resolve({ sectors: [] }),
        canManageDepartments
          ? getDepartments(token).catch(() => ({ departments: [] }))
          : Promise.resolve({ departments: [] }),
        canManageStructure
          ? getCategories(token).catch(() => ({ categories: [] }))
          : Promise.resolve({ categories: [] }),
        canManageUsers
          ? getUsers(token, null, null, null, 1, 20).catch(() => ({
              users: [],
              pagination: {
                page: 1,
                perPage: 20,
                totalCount: 0,
                totalPages: 1,
              },
            }))
          : Promise.resolve({
              users: [],
              pagination: {
                page: 1,
                perPage: 20,
                totalCount: 0,
                totalPages: 1,
              },
            }),
      ])
    units = unitsRes.units
    sectors = sectorsRes.sectors
    departments = departmentsRes.departments
    categories = categoriesRes.categories
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
          Gerenciamento de acessos (PBAC), departamentos do RH, unidades e
          estrutura de estoque.
        </p>
      </div>

      <SettingsContent
        users={users}
        userPagination={userPagination}
        units={units}
        sectors={sectors}
        departments={departments}
        categories={categories}
        activeUnitId={activeUnitId}
        currentUserRole={user.role}
        currentUserPermissions={user.permissions || []}
        canManageUsers={canManageUsers}
        canManageStructure={canManageStructure}
        canManageDepartments={canManageDepartments}
      />
    </div>
  )
}
