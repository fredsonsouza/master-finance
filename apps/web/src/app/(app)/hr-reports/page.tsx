import { auth } from '@/auth/auth'
import { getHrReports, type HrReport, type HrReportPagination } from '@/http/get-hr-reports'
import { getUnits, type Unit } from '@/http/get-units'
import { HrReportsContent } from './hr-reports-content'

export default async function HrReportsPage() {
  const { token, user } = await auth()

  let reports: HrReport[] = []
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
        pagination: { page: 1, perPage: 20, totalCount: 0, totalPages: 1 },
      })),
      getUnits(token).catch(() => ({ units: [] })),
    ])

    reports = reportsRes.reports
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
