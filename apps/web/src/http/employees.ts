import { api } from './api-client'

export interface WorkScheduleDay {
  day: string // 'Dom' | 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sab'
  type: string // e.g., 'Normal', 'Folga', 'DSR', 'Meio Período'
  entry: string
  breakStart: string
  breakEnd: string
  exit: string
}

export interface BeneficiaryItem {
  name: string
  relationship: string
  birthDate?: string
  cpf?: string
}

export interface SalaryRoleHistoryItem {
  date: string
  roleTitle: string
  salary: number
  reason?: string
}

export interface VacationHistoryItem {
  acquisitivePeriod: string
  enjoymentPeriod: string
  pecuniaryAllowance?: string
}

export interface OccupationalHealthItem {
  date: string
  description: string
  returnDate?: string
}

export interface UnionContributionItem {
  year: string
  amount: number
  unionName?: string
}

export interface Employee {
  id: string
  registrationNumber: string
  esocialCode: string | null
  status: 'ACTIVE' | 'INACTIVE'
  employerName: string
  employerCnpj: string
  employerAddress: string

  fullName: string
  photoUrl: string | null
  birthDate: string | null
  birthPlace: string | null
  nationality: string | null
  maritalStatus: string | null
  raceColor: string | null
  fatherName: string | null
  motherName: string | null
  address: string | null
  zipCode: string | null
  landlinePhone: string | null
  mobilePhone: string | null
  email: string | null
  beneficiaries: BeneficiaryItem[] | null

  cpf: string
  rgNumber: string | null
  rgIssueDate: string | null
  rgIssuer: string | null
  ctpsNumber: string | null
  ctpsSeries: string | null
  ctpsIssueDate: string | null
  ctpsState: string | null
  voterRegistration: string | null
  voterZone: string | null
  voterSection: string | null
  cnhNumber: string | null
  cnhCategory: string | null
  militaryDoc: string | null
  militaryCategory: string | null
  classCouncilNumber: string | null

  admissionDate: string
  roleTitle: string
  cboCode: string | null
  salary: number
  paymentType: string | null
  workHoursSummary: string | null
  breakHoursSummary: string | null
  fgtsOptionDate: string | null
  fgtsRectificationDate: string | null
  fgtsBankAccount: string | null
  pisRegistrationDate: string | null
  pisNumber: string | null
  pisBankName: string | null
  pisBankNumber: string | null
  pisBankBranch: string | null
  pisBankAddress: string | null

  workSchedule: WorkScheduleDay[] | null
  salaryRoleHistory: SalaryRoleHistoryItem[] | null
  vacationsHistory: VacationHistoryItem[] | null
  occupationalHealthHistory: OccupationalHealthItem[] | null
  unionContributions: UnionContributionItem[] | null
  generalObservations: string | null

  terminationDate: string | null
  terminationType: string | null
  terminationNotes: string | null

  userId: string | null
  unitId: string | null
  sectorId: string | null
  unit?: { id: string; name: string } | null
  sector?: { id: string; name: string } | null
  user?: { id: string; name: string; username: string; role: string } | null
  requests?: EmployeeRequestItem[]
  createdAt: string
  updatedAt: string
}

export interface EmployeesSummary {
  totalCount: number
  activeCount: number
  inactiveCount: number
}

export interface PaginationMeta {
  page: number
  perPage: number
  totalCount: number
  totalPages: number
}

export interface EmployeeRequestItem {
  id: string
  type: 'DECLARATION' | 'WARNING' | 'RECEIPT'
  subtype: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
  amount: number | null
  referenceDate: string
  templateData: Record<string, any> | null
  rejectionReason: string | null
  verificationCode: string | null
  contentHash: string | null
  signedAt: string | null
  employeeId: string
  unitId: string | null
  requestedById: string
  issuedById: string | null
  employee: Employee
  requestedBy: { id: string; name: string; role: string }
  issuedBy?: { id: string; name: string; role: string } | null
  createdAt: string
  updatedAt: string
}

export interface EmployeeRequestsSummary {
  totalCount: number
  openCount: number
  inProgressCount: number
  completedCount: number
  rejectedCount: number
}

export async function getEmployees(
  token: string,
  params?: {
    search?: string
    status?: 'ACTIVE' | 'INACTIVE'
    unitId?: string
    sectorId?: string
    page?: number
    perPage?: number
  }
) {
  const searchParams: Record<string, string> = {}
  if (params?.search) searchParams.search = params.search
  if (params?.status) searchParams.status = params.status
  if (params?.unitId) searchParams.unitId = params.unitId
  if (params?.sectorId) searchParams.sectorId = params.sectorId
  if (params?.page) searchParams.page = String(params.page)
  if (params?.perPage) searchParams.perPage = String(params.perPage)

  return api
    .get('employees', {
      headers: { Authorization: `Bearer ${token}` },
      searchParams:
        Object.keys(searchParams).length > 0 ? searchParams : undefined,
      next: { tags: ['employees'], revalidate: 0 },
    })
    .json<{
      employees: Employee[]
      summary: EmployeesSummary
      pagination: PaginationMeta
    }>()
}

export async function getEmployee(token: string, id: string) {
  return api
    .get(`employees/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { tags: ['employees'], revalidate: 0 },
    })
    .json<{ employee: Employee }>()
}

export async function createEmployeeApi(
  token: string,
  data: Record<string, any>
) {
  return api
    .post('employees', {
      headers: { Authorization: `Bearer ${token}` },
      json: data,
    })
    .json<{ employeeId: string; registrationNumber: string }>()
}

export async function updateEmployeeApi(
  token: string,
  id: string,
  data: Record<string, any>
) {
  await api.put(`employees/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    json: data,
  })
}

export async function changeEmployeeStatusApi(
  token: string,
  id: string,
  data: {
    status: 'ACTIVE' | 'INACTIVE'
    terminationDate?: string | null
    terminationType?: string | null
    terminationNotes?: string | null
  }
) {
  await api.patch(`employees/${id}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    json: data,
  })
}

export async function getEmployeeRequests(
  token: string,
  params?: {
    status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
    type?: 'DECLARATION' | 'WARNING' | 'RECEIPT'
    employeeId?: string
    unitId?: string
    search?: string
    page?: number
    perPage?: number
  }
) {
  const searchParams: Record<string, string> = {}
  if (params?.status) searchParams.status = params.status
  if (params?.type) searchParams.type = params.type
  if (params?.employeeId) searchParams.employeeId = params.employeeId
  if (params?.unitId) searchParams.unitId = params.unitId
  if (params?.search) searchParams.search = params.search
  if (params?.page) searchParams.page = String(params.page)
  if (params?.perPage) searchParams.perPage = String(params.perPage)

  return api
    .get('employee-requests', {
      headers: { Authorization: `Bearer ${token}` },
      searchParams:
        Object.keys(searchParams).length > 0 ? searchParams : undefined,
      next: { tags: ['employee-requests'], revalidate: 0 },
    })
    .json<{
      requests: EmployeeRequestItem[]
      summary: EmployeeRequestsSummary
      pagination: PaginationMeta
    }>()
}

export async function createEmployeeRequestApi(
  token: string,
  data: {
    employeeId?: string
    type: 'DECLARATION' | 'WARNING' | 'RECEIPT'
    subtype: string
    title: string
    description: string
    amount?: number | null
    referenceDate?: string
    templateData?: Record<string, any> | null
    status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'
  }
) {
  return api
    .post('employee-requests', {
      headers: { Authorization: `Bearer ${token}` },
      json: data,
    })
    .json<{ request: EmployeeRequestItem }>()
}

export async function updateEmployeeRequestStatusApi(
  token: string,
  id: string,
  data: {
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
    title?: string
    description?: string
    amount?: number | null
    templateData?: Record<string, any> | null
    rejectionReason?: string | null
  }
) {
  return api
    .patch(`employee-requests/${id}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      json: data,
    })
    .json<{ request: EmployeeRequestItem }>()
}

export async function deleteEmployeeRequestApi(token: string, id: string) {
  await api.delete(`employee-requests/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export interface VerifiedDocumentResponse {
  valid: boolean
  document: {
    id: string
    verificationCode: string
    contentHash: string
    type: 'DECLARATION' | 'WARNING' | 'RECEIPT'
    subtype: string
    title: string
    signedAt: string
    employee: {
      fullName: string
      registrationNumber: string
      cpfMasked: string
      roleTitle: string
      employerName: string
      employerCnpj: string
    }
    issuedBy: {
      name: string
      role: string
    }
  }
}

export async function verifyEmployeeDocumentPublic(code: string) {
  return api
    .get(`public/verify/${encodeURIComponent(code)}`, {
      next: { revalidate: 0 },
    })
    .json<VerifiedDocumentResponse>()
}
