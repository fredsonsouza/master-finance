import { auth } from '@/auth/auth'
import {
  type Employee,
  type EmployeesSummary,
  type PaginationMeta,
  getEmployees,
} from '@/http/employees'
import { type Sector, getSectors } from '@/http/get-sectors'
import { type Unit, getUnits } from '@/http/get-units'
import { type User, getUsers } from '@/http/get-users'
import { redirect } from 'next/navigation'
import { EmployeesContent } from './employees-content'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const { user, token } = await auth()

  if (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'HR') {
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
    perPage: 50,
    totalCount: 0,
    totalPages: 0,
  }
  let units: Unit[] = []
  let sectors: Sector[] = []
  let users: User[] = []

  try {
    const [employeesRes, unitsRes, sectorsRes, usersRes] = await Promise.all([
      getEmployees(token, { page: 1, perPage: 50 }).catch(() => ({
        employees: [],
        summary: { totalCount: 0, activeCount: 0, inactiveCount: 0 },
        pagination: { page: 1, perPage: 50, totalCount: 0, totalPages: 0 },
      })),
      getUnits(token).catch(() => ({ units: [] })),
      getSectors(token).catch(() => ({ sectors: [] })),
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
      perPage: 50,
      totalCount: 0,
      totalPages: 0,
    }
    units = unitsRes.units || []
    sectors = sectorsRes.sectors || []
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
            Gerencie fichas de registro de empregados, matrículas padronizadas
            (MASTER-XXXX), status contratual e exportação oficial em PDF
          </p>
        </div>
      </div>

      <EmployeesContent
        initialEmployees={employees}
        initialSummary={summary}
        initialPagination={pagination}
        units={units}
        sectors={sectors}
        users={users}
      />
    </div>
  )
}
