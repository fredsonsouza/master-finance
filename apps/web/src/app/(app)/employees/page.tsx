import { auth } from '@/auth/auth'
import { type Department, getDepartments } from '@/http/departments'
import {
  type Employee,
  type EmployeesSummary,
  type PaginationMeta,
  getEmployees,
} from '@/http/employees'
import { type Unit, getUnits } from '@/http/get-units'
import { type User, getUsers } from '@/http/get-users'
import { hasPermission } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { EmployeesContent } from './employees-content'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const { user, token } = await auth()

  if (!hasPermission(user, 'employees:manage')) {
    redirect('/employees/requests')
  }

  let employees: Employee[] = []
  let summary: EmployeesSummary = {
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0,
  }
  let pagination: PaginationMeta = {
    page: 1,
    perPage: 20,
    totalCount: 0,
    totalPages: 1,
  }
  let units: Unit[] = []
  let departments: Department[] = []
  let users: User[] = []

  try {
    const [employeesRes, unitsRes, departmentsRes, usersRes] =
      await Promise.all([
        getEmployees(token, { page: 1, perPage: 20 }).catch(() => ({
          employees: [],
          summary: { totalCount: 0, activeCount: 0, inactiveCount: 0 },
          pagination: { page: 1, perPage: 20, totalCount: 0, totalPages: 1 },
        })),
        getUnits(token).catch(() => ({ units: [] })),
        getDepartments(token).catch(() => ({ departments: [] })),
        getUsers(token, null, null, null, 1, 200).catch(() => ({ users: [] })),
      ])

    employees = employeesRes.employees || []
    summary = employeesRes.summary || {
      totalCount: 0,
      activeCount: 0,
      inactiveCount: 0,
    }
    pagination = employeesRes.pagination || {
      page: 1,
      perPage: 20,
      totalCount: 0,
      totalPages: 1,
    }
    units = unitsRes.units || []
    departments = departmentsRes.departments || []
    users = usersRes.users || []
  } catch (err) {
    console.error(err)
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">
            Quadro de Colaboradores
          </h1>
          <p className="text-on-surface-variant">
            Gerencie fichas de registro de empregados, departamentos, matrículas
            padronizadas (MASTER-XXXX) e acessos por permissão (PBAC)
          </p>
        </div>
      </div>

      <EmployeesContent
        initialEmployees={employees}
        initialSummary={summary}
        initialPagination={pagination}
        units={units}
        departments={departments}
        users={users}
        currentUserRole={user.role}
        currentUserPermissions={user.permissions || []}
      />
    </div>
  )
}
