import { auth } from '@/auth/auth'
import {
  type Employee,
  type EmployeeRequestItem,
  type EmployeeRequestsSummary,
  getEmployeeRequests,
  getEmployees,
} from '@/http/employees'
import { EmployeeRequestsContent } from './employee-requests-content'

export const dynamic = 'force-dynamic'

export default async function EmployeeRequestsPage() {
  const { user, token } = await auth()

  const isHrManager =
    user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'HR'

  let requests: EmployeeRequestItem[] = []
  let summary: EmployeeRequestsSummary = {
    totalCount: 0,
    openCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    rejectedCount: 0,
  }
  let employees: Employee[] = []

  try {
    const [requestsRes, employeesRes] = await Promise.all([
      getEmployeeRequests(token).catch(() => ({
        requests: [],
        summary: {
          totalCount: 0,
          openCount: 0,
          inProgressCount: 0,
          completedCount: 0,
          rejectedCount: 0,
        },
        pagination: { page: 1, perPage: 50, totalCount: 0, totalPages: 0 },
      })),
      isHrManager
        ? getEmployees(token, { page: 1, perPage: 200 }).catch(() => ({
            employees: [],
            summary: { totalCount: 0, activeCount: 0, inactiveCount: 0 },
            pagination: { page: 1, perPage: 200, totalCount: 0, totalPages: 0 },
          }))
        : Promise.resolve({ employees: [] }),
    ])

    requests = requestsRes.requests || []
    summary = requestsRes.summary || {
      totalCount: 0,
      openCount: 0,
      inProgressCount: 0,
      completedCount: 0,
      rejectedCount: 0,
    }
    employees = employeesRes.employees || []
  } catch (err) {
    console.error(err)
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">
            {isHrManager
              ? 'Solicitações & Emissão de Documentos de RH'
              : 'Minhas Solicitações & Documentos de RH'}
          </h1>
          <p className="text-on-surface-variant">
            {isHrManager
              ? 'Gerencie requisições de colaboradores e emita declarações, advertências e recibos assinados eletronicamente com QR Code verificável'
              : 'Solicite declarações ou comprovantes ao RH, acompanhe o andamento e baixe seus documentos assinados eletronicamente'}
          </p>
        </div>
      </div>

      <EmployeeRequestsContent
        initialRequests={requests}
        initialSummary={summary}
        employees={employees}
        currentUser={{
          id: user.id,
          name: user.name || 'Usuário',
          role: user.role,
          registrationNumber: user.employee?.registrationNumber || null,
          employeeId: user.employee?.id || null,
        }}
      />
    </div>
  )
}
