'use server'

import { auth } from '@/auth/auth'
import {
  changeEmployeeStatusApi,
  createEmployeeApi,
  createEmployeeRequestApi,
  deleteEmployeeRequestApi,
  getEmployee,
  getEmployeeRequests,
  getEmployees,
  updateEmployeeApi,
  updateEmployeeRequestStatusApi,
} from '@/http/employees'
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

export async function fetchEmployeesAction(params?: {
  search?: string
  status?: 'ACTIVE' | 'INACTIVE'
  unitId?: string
  sectorId?: string
  page?: number
  perPage?: number
}) {
  try {
    const { token } = await auth()
    const res = await getEmployees(token, params)
    return {
      success: true,
      employees: res.employees,
      summary: res.summary,
      pagination: res.pagination,
    }
  } catch (error) {
    return {
      success: false,
      message: await extractErrorMessage(
        error,
        'Erro ao buscar lista de colaboradores.'
      ),
    }
  }
}

export async function fetchEmployeeDetailsAction(id: string) {
  try {
    const { token } = await auth()
    const res = await getEmployee(token, id)
    return {
      success: true,
      employee: res.employee,
    }
  } catch (error) {
    return {
      success: false,
      message: await extractErrorMessage(
        error,
        'Erro ao carregar ficha completa do colaborador.'
      ),
    }
  }
}

export async function createEmployeeAction(data: Record<string, any>) {
  try {
    const { token } = await auth()
    const res = await createEmployeeApi(token, data)
    updateTag('employees')
    revalidatePath('/employees')
    return {
      success: true,
      employeeId: res.employeeId,
      registrationNumber: res.registrationNumber,
    }
  } catch (error) {
    return {
      success: false,
      message: await extractErrorMessage(
        error,
        'Erro ao cadastrar colaborador.'
      ),
    }
  }
}

export async function updateEmployeeAction(
  id: string,
  data: Record<string, any>
) {
  try {
    const { token } = await auth()
    await updateEmployeeApi(token, id, data)
    updateTag('employees')
    revalidatePath('/employees')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      message: await extractErrorMessage(
        error,
        'Erro ao atualizar ficha do colaborador.'
      ),
    }
  }
}

export async function changeEmployeeStatusAction(
  id: string,
  data: {
    status: 'ACTIVE' | 'INACTIVE'
    terminationDate?: string | null
    terminationType?: string | null
    terminationNotes?: string | null
  }
) {
  try {
    const { token } = await auth()
    await changeEmployeeStatusApi(token, id, data)
    updateTag('employees')
    revalidatePath('/employees')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      message: await extractErrorMessage(
        error,
        'Erro ao alterar status do colaborador.'
      ),
    }
  }
}

export async function fetchEmployeeRequestsAction(params?: {
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
  type?: 'DECLARATION' | 'WARNING' | 'RECEIPT'
  employeeId?: string
  unitId?: string
  search?: string
  page?: number
  perPage?: number
}) {
  try {
    const { token } = await auth()
    const res = await getEmployeeRequests(token, params)
    return {
      success: true,
      requests: res.requests,
      summary: res.summary,
      pagination: res.pagination,
    }
  } catch (error) {
    return {
      success: false,
      message: await extractErrorMessage(
        error,
        'Erro ao carregar solicitações de documentos.'
      ),
    }
  }
}

export async function createEmployeeRequestAction(data: {
  employeeId?: string
  type: 'DECLARATION' | 'WARNING' | 'RECEIPT'
  subtype: string
  title: string
  description: string
  amount?: number | null
  referenceDate?: string
  templateData?: Record<string, any> | null
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'
}) {
  try {
    const { token } = await auth()
    const res = await createEmployeeRequestApi(token, data)
    updateTag('employee-requests')
    updateTag('employees')
    revalidatePath('/employees/requests')
    revalidatePath('/employees')
    return {
      success: true,
      request: res.request,
    }
  } catch (error) {
    return {
      success: false,
      message: await extractErrorMessage(
        error,
        'Erro ao registrar solicitação ou emissão de documento.'
      ),
    }
  }
}

export async function updateEmployeeRequestStatusAction(
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
  try {
    const { token } = await auth()
    const res = await updateEmployeeRequestStatusApi(token, id, data)
    updateTag('employee-requests')
    updateTag('employees')
    revalidatePath('/employees/requests')
    revalidatePath('/employees')
    return {
      success: true,
      request: res.request,
    }
  } catch (error) {
    return {
      success: false,
      message: await extractErrorMessage(
        error,
        'Erro ao atualizar status da solicitação.'
      ),
    }
  }
}

export async function deleteEmployeeRequestAction(id: string) {
  try {
    const { token } = await auth()
    await deleteEmployeeRequestApi(token, id)
    updateTag('employee-requests')
    revalidatePath('/employees/requests')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      message: await extractErrorMessage(
        error,
        'Erro ao excluir solicitação de documento.'
      ),
    }
  }
}
