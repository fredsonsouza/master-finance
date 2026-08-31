import {
  ArrowRightLeft,
  BarChart3,
  Boxes,
  CircleDollarSign,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Star,
  Syringe,
  Users,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'

import { signOutAction } from '@/app/auth/sign-out-action'
import { auth } from '@/auth/auth'

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
    <aside className="w-64 border-r border-surface-container bg-surface flex flex-col">
      <div className="p-6">
        <h1 className="font-display text-2xl font-bold text-primary">
          Master Admin
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-4 overflow-y-auto">
        {/* Visão Geral */}
        {user.role !== 'INVENTORY' && (
          <div className="space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors text-sm font-medium"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Visão Geral</span>
            </Link>
          </div>
        )}

        {/* Menu: ESTOQUE */}
        {canViewStock && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">
              <Boxes className="h-3.5 w-3.5 text-primary" />
              <span>Estoque</span>
            </div>
            <div className="pl-2 space-y-1">
              <Link
                href="/transactions"
                className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors font-medium"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                <span>Transações</span>
              </Link>
              <Link
                href="/items"
                className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors font-medium"
              >
                <Package className="h-3.5 w-3.5" />
                <span>Catálogo de Itens</span>
              </Link>
            </div>
          </div>
        )}

        {/* Menu: FINANCEIRO */}
        {canViewFinancial && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">
              <CircleDollarSign className="h-3.5 w-3.5 text-primary" />
              <span>Financeiro</span>
            </div>
            <div className="pl-2 space-y-1">
              <Link
                href="/cash-closures"
                className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors font-medium"
              >
                <Wallet className="h-3.5 w-3.5" />
                <span>Fechamentos</span>
              </Link>
            </div>
          </div>
        )}

        {/* Menu: RH */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>RH</span>
          </div>
          <div className="pl-2 space-y-1">
            {canViewEvaluations && (
              <Link
                href="/evaluations"
                className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors font-medium"
              >
                <Star className="h-3.5 w-3.5" />
                <span>Meus Atendimentos</span>
              </Link>
            )}
            <Link
              href="/hr-reports"
              className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors font-medium"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Relatórios dos Setores</span>
            </Link>
          </div>
        </div>

        {/* Módulos Operacionais Adicionais */}
        {(canViewCollections || canViewReports || canViewLogs) && (
          <div className="space-y-1 pt-1 border-t border-surface-container/60">
            {canViewCollections && (
              <Link
                href="/collections"
                className="flex items-center gap-3 rounded-md px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors font-medium"
              >
                <Syringe className="h-4 w-4" />
                <span>Recoletas</span>
              </Link>
            )}
            {canViewReports && (
              <Link
                href="/reports"
                className="flex items-center gap-3 rounded-md px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors font-medium"
              >
                <BarChart3 className="h-4 w-4" />
                <span>
                  {user.role === 'FISCAL' ? 'Relatório Recoletas' : 'Relatórios Analíticos'}
                </span>
              </Link>
            )}
            {canViewLogs && (
              <Link
                href="/logs"
                className="flex items-center gap-3 rounded-md px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors font-medium"
              >
                <History className="h-4 w-4" />
                <span>Logs de Auditoria</span>
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Configurações e Logout no Rodapé */}
      <div className="p-4 border-t border-surface-container space-y-1">
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
