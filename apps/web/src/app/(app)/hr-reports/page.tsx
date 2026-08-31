import { auth } from '@/auth/auth'
import {
  getHrReports,
  type HrReport,
  type HrReportPagination,
  type HrReportSummary,
} from '@/http/get-hr-reports'
import { getUnits, type Unit } from '@/http/get-units'
import { HrReportsContent } from './hr-reports-content'

export default async function HrReportsPage() {
  const { token, user } = await auth()

  let reports: HrReport[] = []
  let summary: HrReportSummary = {
    totalCount: 0,
    sentCount: 0,
    draftCount: 0,
  }
  let pagination: HrReportPagination = {
    page: 1,
    perPage: 20,
    totalCount: 0,
    totalPages: 1,
  }
  let units: Unit[] = []

  try {
    const [reportsRes, unitsRes] = await Promise.all([
      getHrReports(token).catch(() => ({
        reports: [],
        summary: { totalCount: 0, sentCount: 0, draftCount: 0 },
        pagination: { page: 1, perPage: 20, totalCount: 0, totalPages: 1 },
      })),
      getUnits(token).catch(() => ({ units: [] })),
    ])

    reports = reportsRes.reports
    summary = reportsRes.summary || {
      totalCount: reportsRes.pagination?.totalCount || 0,
      sentCount: 0,
      draftCount: 0,
    }
    pagination = reportsRes.pagination
    units = unitsRes.units || []

    // If non-global role has no access to list all units, fallback to their assigned unit
    if (units.length === 0 && user.unit) {
      units = [
        {
          id: user.unit.id,
          name: user.unit.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
      ]
    }
  } catch (err) {
    console.error('Error fetching HR reports page data:', err)
  }

  return (
    <HrReportsContent
      initialReports={reports}
      initialSummary={summary}
      initialPagination={pagination}
      units={units}
      currentUser={{
        id: user.id,
        name: user.name || 'Usuário',
        role: user.role,
        unitId: user.unitId,
      }}
    />
  )
}
