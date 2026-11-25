'use server'

import { auth } from '@/auth/auth'
import {
  type EmployeeSubmissionCategory,
  type EmployeeSubmissionStatus,
  createEmployeeSubmissionApi,
  deleteEmployeeSubmissionApi,
  getEmployeeSubmissions,
  updateEmployeeSubmissionStatusApi,
} from '@/http/employee-submissions'
import { revalidatePath, updateTag } from 'next/cache'

async function extractErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'json' in error.response &&
    typeof error.response.json === 'function'
  ) {
    try {
      const errData = (await error.response.json()) as { message?: string }
      if (errData?.message) return errData.message
    } catch {}
  }
  return fallback
}

export async function fetchEmployeeSubmissionsAction(params?: {
  status?: EmployeeSubmissionStatus
  category?: EmployeeSubmissionCategory
  employeeId?: string
  unitId?: string
  search?: string
  page?: number
  perPage?: number
}) {
  try {
    const { token } = await auth()
    const res = await getEmployeeSubmissions(token, params)
    return {
      success: true as const,
      submissions: res.submissions,
      summary: res.summary,
      pagination: res.pagination,
    }
  } catch (error) {
    return {
      success: false as const,
      message: await extractErrorMessage(
        error,
        'Erro ao carregar atestados e documentos enviados.'
      ),
    }
  }
}

export async function createEmployeeSubmissionAction(data: {
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
}) {
  try {
    const { token } = await auth()
    const res = await createEmployeeSubmissionApi(token, data)
    updateTag('employee-submissions')
    revalidatePath('/employees/submissions')
    return {
      success: true as const,
      submission: res.submission,
    }
  } catch (error) {
    return {
      success: false as const,
      message: await extractErrorMessage(
        error,
        'Erro ao enviar o arquivo PDF.'
      ),
    }
  }
}

export async function updateEmployeeSubmissionStatusAction(
  id: string,
  data: {
    status: EmployeeSubmissionStatus
    reviewNotes?: string | null
    rejectionReason?: string | null
  }
) {
  try {
    const { token } = await auth()
    const res = await updateEmployeeSubmissionStatusApi(token, id, data)
    updateTag('employee-submissions')
    revalidatePath('/employees/submissions')
    return {
      success: true as const,
      submission: res.submission,
    }
  } catch (error) {
    return {
      success: false as const,
      message: await extractErrorMessage(
        error,
        'Erro ao atualizar o status do documento enviado.'
      ),
    }
  }
}

export async function deleteEmployeeSubmissionAction(id: string) {
  try {
    const { token } = await auth()
    await deleteEmployeeSubmissionApi(token, id)
    updateTag('employee-submissions')
    revalidatePath('/employees/submissions')
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      message: await extractErrorMessage(
        error,
        'Erro ao excluir o documento enviado.'
      ),
    }
  }
}
