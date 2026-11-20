import { auth } from '@/auth/auth'
import { getActiveUnit } from '@/components/unit-switcher-action'
import { getCollectionsReports } from '@/http/get-collections-reports'
import type { GetCollectionsReportsResponse } from '@/http/get-collections-reports'
import { getExecutiveReports } from '@/http/get-executive-reports'
import type { GetExecutiveReportsResponse } from '@/http/get-executive-reports'
import { getUnits } from '@/http/get-units'
import {
  getDefaultHomeRoute,
  hasAnyPermission,
  hasPermission,
} from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { ReportsDashboard } from './reports-dashboard'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const { user, token } = await auth()

  if (!hasAnyPermission(user, ['reports:view', 'collections:manage'])) {
    redirect(getDefaultHomeRoute(user))
  }

  const { month } = await searchParams
  const selectedMonth = typeof month === 'string' ? month : undefined

  const activeUnitId = await getActiveUnit()

  let activeUnitName: string | null = null

  if (activeUnitId) {
    try {
      const { units } = await getUnits(token)
      const found = units.find((u) => u.id === activeUnitId)
      if (found) activeUnitName = found.name
    } catch (err) {
      console.error(err)
    }
  }

  let financialData: GetExecutiveReportsResponse = {
    monthlyFlow: [],
    topItems: [],
    costBySector: [],
    costByUnit: [],
  }

  let collectionsData: GetCollectionsReportsResponse = {
    monthlyHistory: [],
    collectorRanking: [],
    topExams: [],
  }

  const hasFinancialAccess = hasPermission(user, 'reports:view')

  try {
    if (hasFinancialAccess) {
      const [finRes, colRes] = await Promise.all([
        getExecutiveReports(token, activeUnitId, selectedMonth).catch(() => ({
          monthlyFlow: [],
          topItems: [],
          costBySector: [],
          costByUnit: [],
        })),
        getCollectionsReports(token, activeUnitId, selectedMonth).catch(() => ({
          monthlyHistory: [],
          collectorRanking: [],
          topExams: [],
        })),
      ])
      financialData = finRes
      collectionsData = colRes
    } else {
      const colRes = await getCollectionsReports(
        token,
        activeUnitId,
        selectedMonth
      )
      collectionsData = colRes
    }
  } catch (err) {
    console.error('Failed to load reports', err)
  }

  return (
    <ReportsDashboard
      financialData={financialData}
      collectionsData={collectionsData}
      activeUnitName={activeUnitName}
      selectedMonth={selectedMonth}
      hasFinancialAccess={hasFinancialAccess}
    />
  )
}
