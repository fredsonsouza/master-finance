import { LogOut } from 'lucide-react'

import { signOutAction } from '@/app/auth/sign-out-action'
import { auth } from '@/auth/auth'
import { hasAnyPermission, hasPermission } from '@/lib/permissions'
import { SidebarNav } from './sidebar-nav'

export async function Sidebar() {
  const { user } = await auth()

  const canViewDashboard = hasPermission(user, 'dashboard:view')
  const canViewTransactions = hasPermission(user, 'transactions:manage')
  const canViewItems = hasAnyPermission(user, [
    'transactions:manage',
    'items:manage',
  ])
  const canViewReports = hasAnyPermission(user, [
    'reports:view',
    'collections:manage',
  ])
  const canViewStock = canViewTransactions || canViewItems || canViewReports
  const canViewFinancial = hasAnyPermission(user, [
    'cash_closures:create',
    'cash_closures:manage',
  ])
  const canViewEvaluations = hasAnyPermission(user, [
    'evaluations:manage',
    'evaluations:view_own',
  ])
  const canViewCollections = hasAnyPermission(user, [
    'collections:manage',
    'collections:execute',
  ])
  const onlyCollectionsReports =
    !hasPermission(user, 'reports:view') &&
    hasPermission(user, 'collections:manage')
  const canManageEmployees = hasPermission(user, 'employees:manage')
  const canViewLogs = hasPermission(user, 'logs:view')
  const canViewSettings = hasAnyPermission(user, [
    'users:manage',
    'settings:structure',
    'employees:manage',
  ])

  return (
    <aside className="h-full w-64 shrink-0 border-r border-surface-container bg-surface flex flex-col">
      <div className="p-6 shrink-0">
        <h1 className="font-display text-2xl font-bold text-primary">
          Master Admin
        </h1>
      </div>

      <SidebarNav
        canViewDashboard={canViewDashboard}
        canViewStock={canViewStock}
        canViewTransactions={canViewTransactions}
        canViewItems={canViewItems}
        canViewFinancial={canViewFinancial}
        canViewEvaluations={canViewEvaluations}
        canViewCollections={canViewCollections}
        canViewReports={canViewReports}
        onlyCollectionsReports={onlyCollectionsReports}
        canManageEmployees={canManageEmployees}
        canViewSettings={canViewSettings}
        canViewLogs={canViewLogs}
      />

      {/* Logout no Rodapé */}
      <div className="p-4 border-t border-surface-container shrink-0">
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-error hover:bg-error-container transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
