import { api } from './api-client'
import type { Employee, PaginationMeta } from './employees'

export type EmployeeSubmissionCategory =
  | 'MEDICAL_CERTIFICATE'
  | 'ATTENDANCE_DECLARATION'
  | 'PERSONAL_DOCUMENT'
  | 'OTHER'

export type EmployeeSubmissionStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'

export interface EmployeeSubmissionItem {
  id: string
  category: EmployeeSubmissionCategory
  title: string
  description: string | null
  status: EmployeeSubmissionStatus
  startDate: string | null
  daysCount: number | null
  cid: string | null
  fileName: string
  mimeType: string
  sizeBytes: number
  sha256Hash: string
  reviewNotes: string | null
  rejectionReason: string | null
  reviewedAt: string | null
  employeeId: string
  unitId: string | null
  submittedById: string
  reviewedById: string | null
  employee: Employee
  submittedBy: {
    id: string
    name: string
    role: string
    permissions?: string[]
  }
  reviewedBy?: {
    id: string
    name: string
    role: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface EmployeeSubmissionsSummary {
  totalCount: number
  pendingCount: number
  underReviewCount: number
  approvedCount: number
  rejectedCount: number
}

export async function getEmployeeSubmissions(
  token: string,
  params?: {
    status?: EmployeeSubmissionStatus
    category?: EmployeeSubmissionCategory
    employeeId?: string
    unitId?: string
    search?: string
    page?: number
    perPage?: number
  }
) {
  const searchParams: Record<string, string> = {}
  if (params?.status) searchParams.status = params.status
  if (params?.category) searchParams.category = params.category
  if (params?.employeeId) searchParams.employeeId = params.employeeId
  if (params?.unitId) searchParams.unitId = params.unitId
  if (params?.search) searchParams.search = params.search
  if (params?.page) searchParams.page = String(params.page)
  if (params?.perPage) searchParams.perPage = String(params.perPage)

  return api
    .get('employee-submissions', {
      headers: { Authorization: `Bearer ${token}` },
      searchParams:
        Object.keys(searchParams).length > 0 ? searchParams : undefined,
      next: { tags: ['employee-submissions'], revalidate: 0 },
    })
    .json<{
      submissions: EmployeeSubmissionItem[]
      summary: EmployeeSubmissionsSummary
      pagination: PaginationMeta
    }>()
}

export async function createEmployeeSubmissionApi(
  token: string,
  data: {
    employeeId?: string
    category: EmployeeSubmissionCategory
    title: string
    description?: string | null
    startDate?: string | null
    daysCount?: number | null
    cid?: string | null
    fileName: string
    mimeType?: string
    fileData: string
    status?: 'PENDING' | 'APPROVED'
  }
) {
  return api
    .post('employee-submissions', {
      headers: { Authorization: `Bearer ${token}` },
      json: data,
      timeout: 60_000,
    })
    .json<{ submission: EmployeeSubmissionItem }>()
}

export async function updateEmployeeSubmissionStatusApi(
  token: string,
  id: string,
  data: {
    status: EmployeeSubmissionStatus
    reviewNotes?: string | null
    rejectionReason?: string | null
  }
) {
  return api
    .patch(`employee-submissions/${id}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      json: data,
    })
    .json<{ submission: EmployeeSubmissionItem }>()
}

export async function deleteEmployeeSubmissionApi(token: string, id: string) {
  await api.delete(`employee-submissions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
