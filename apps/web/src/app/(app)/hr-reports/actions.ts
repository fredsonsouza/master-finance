'use server'

import { auth } from '@/auth/auth'
import { createHrReport } from '@/http/create-hr-report'
import { deleteHrReport } from '@/http/delete-hr-report'
import { getHrReports, type HrReport } from '@/http/get-hr-reports'
import { updateHrReport } from '@/http/update-hr-report'
import { revalidatePath } from 'next/cache'

export async function fetchHrReportsAction(params?: {
  status?: 'DRAFT' | 'SENT'
  unitId?: string | null
  sectorId?: string | null
  userId?: string | null
  startDate?: string | null
  endDate?: string | null
  search?: string | null
  page?: number
  perPage?: number
}) {
  const { token } = await auth()
  if (!token) return { success: false, data: null, message: 'Não autenticado' }

  try {
    const data = await getHrReports(token, params)
    return { success: true, data, message: null }
  } catch (err: unknown) {
    return { success: false, data: null, message: 'Erro ao buscar relatórios.' }
  }
}

export async function saveHrReportAction(data: {
  id?: string | null
  title: string
  content: string
  reportDate: string
  status: 'DRAFT' | 'SENT'
  unitId?: string | null
  sectorId?: string | null
}) {
  const { token } = await auth()
  if (!token) return { success: false, report: null, message: 'Não autenticado' }

  try {
    if (data.id) {
      // Update existing report
      const result = await updateHrReport(token, data.id, {
        title: data.title,
        content: data.content,
        reportDate: data.reportDate,
        status: data.status,
        unitId: data.unitId,
        sectorId: data.sectorId,
      })
      revalidatePath('/hr-reports')
      return { success: true, report: result.report, message: null }
    } else {
      // Create new report
      const result = await createHrReport(token, {
        title: data.title,
        content: data.content,
        reportDate: data.reportDate,
        status: data.status,
        unitId: data.unitId,
        sectorId: data.sectorId,
      })
      revalidatePath('/hr-reports')
      return { success: true, report: result.report, message: null }
    }
  } catch (err: unknown) {
    let msg = 'Erro ao salvar relatório.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const e = await (err as any).response.clone().json()
        if (e?.message) msg = e.message
      } catch {}
    }
    return { success: false, report: null, message: msg }
  }
}

export async function deleteHrReportAction(id: string) {
  const { token } = await auth()
  if (!token) return { success: false, message: 'Não autenticado' }

  try {
    await deleteHrReport(token, id)
    revalidatePath('/hr-reports')
    return { success: true, message: null }
  } catch (err: unknown) {
    let msg = 'Erro ao excluir relatório.'
    if (err && typeof err === 'object' && 'response' in err) {
      try {
        const e = await (err as any).response.clone().json()
        if (e?.message) msg = e.message
      } catch {}
    }
    return { success: false, message: msg }
  }
}
