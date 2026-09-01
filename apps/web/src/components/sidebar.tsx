import { LogOut, Settings } from 'lucide-react'
import Link from 'next/link'

import { signOutAction } from '@/app/auth/sign-out-action'
import { auth } from '@/auth/auth'
import { SidebarNav } from './sidebar-nav'

export async function Sidebar() {
  const { user } = await auth()

  const canViewStock =
    user.role === 'ADMIN' ||
    user.role === 'MANAGER' ||
    user.role === 'INVENTORY' ||
    user.role === 'EMPLOYEE' ||
    user.role === 'SELLER' ||
    user.role === 'FINANCIAL'

  const canViewFinancial =
    user.role === 'ADMIN' ||
    user.role === 'MANAGER' ||
    user.role === 'FINANCIAL' ||
    user.role === 'SELLER'

  const canViewEvaluations =
    user.role === 'ADMIN' ||
    user.role === 'MANAGER' ||
    user.role === 'SELLER'

  const canViewCollections =
    user.role === 'ADMIN' ||
    user.role === 'MANAGER' ||
    user.role === 'FISCAL' ||
    user.role === 'COLLECTOR'

  const canViewReports =
    user.role === 'ADMIN' ||
    user.role === 'MANAGER' ||
    user.role === 'FISCAL'

  const canViewLogs = user.role === 'ADMIN'

  const canViewSettings =
    user.role === 'ADMIN' ||
    user.role === 'MANAGER' ||
    user.role === 'INVENTORY'

  return (
    <aside className="h-full w-64 shrink-0 border-r border-surface-container bg-surface flex flex-col">
      <div className="p-6 shrink-0">
        <h1 className="font-display text-2xl font-bold text-primary">
          Master Admin
        </h1>
      </div>

      <SidebarNav
        userRole={user.role}
        canViewStock={canViewStock}
        canViewFinancial={canViewFinancial}
        canViewEvaluations={canViewEvaluations}
        canViewCollections={canViewCollections}
        canViewReports={canViewReports}
        canViewLogs={canViewLogs}
        canViewSettings={canViewSettings}
      />

      {/* Configurações e Logout no Rodapé */}
      <div className="p-4 border-t border-surface-container space-y-1 shrink-0">
        {canViewSettings && (
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Configurações</span>
          </Link>
        )}
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
