import { auth } from '@/auth/auth'
import {
  type EmployeeSubmissionItem,
  type EmployeeSubmissionsSummary,
  getEmployeeSubmissions,
} from '@/http/employee-submissions'
import {
  type Employee,
  type PaginationMeta,
  getEmployees,
} from '@/http/employees'
import { hasPermission } from '@/lib/permissions'
import { EmployeeSubmissionsContent } from './employee-submissions-content'

export const dynamic = 'force-dynamic'

export default async function EmployeeSubmissionsPage() {
  const { user, token } = await auth()

  const isHrManager = hasPermission(user, 'employees:manage')

  let submissions: EmployeeSubmissionItem[] = []
  let summary: EmployeeSubmissionsSummary = {
    totalCount: 0,
    pendingCount: 0,
    underReviewCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  }
  let pagination: PaginationMeta = {
    page: 1,
    perPage: 20,
    totalCount: 0,
    totalPages: 1,
  }
  let employees: Employee[] = []

  try {
    const [submissionsRes, employeesRes] = await Promise.all([
      getEmployeeSubmissions(token, { page: 1, perPage: 20 }).catch(() => ({
        submissions: [],
        summary: {
          totalCount: 0,
          pendingCount: 0,
          underReviewCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
        },
        pagination: { page: 1, perPage: 20, totalCount: 0, totalPages: 1 },
      })),
      isHrManager
        ? getEmployees(token, { page: 1, perPage: 200 }).catch(() => ({
            employees: [],
            summary: { totalCount: 0, activeCount: 0, inactiveCount: 0 },
            pagination: { page: 1, perPage: 200, totalCount: 0, totalPages: 1 },
          }))
        : Promise.resolve({ employees: [] }),
    ])

    submissions = submissionsRes.submissions || []
    summary = submissionsRes.summary || summary
    pagination = submissionsRes.pagination || pagination
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
              ? 'Atestados Médicos & Envios em PDF'
              : 'Envio de Atestados & Documentos (PDF)'}
          </h1>
          <p className="text-on-surface-variant">
            {isHrManager
              ? 'Receba, visualize e valide atestados médicos, declarações de comparecimento e documentos enviados em PDF pelos colaboradores'
              : 'Envie seus atestados médicos, declarações de comparecimento ou outros documentos em PDF para o RH e acompanhe a análise'}
          </p>
        </div>
      </div>

      <EmployeeSubmissionsContent
        initialSubmissions={submissions}
        initialSummary={summary}
        initialPagination={pagination}
        employees={employees}
        currentUser={{
          id: user.id,
          name: user.name || 'Usuário',
          role: user.role,
          isHrManager,
          registrationNumber: user.employee?.registrationNumber || null,
          employeeId: user.employee?.id || null,
        }}
      />
    </div>
  )
}
