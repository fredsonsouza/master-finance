'use client'

import {
  ArrowRightLeft,
  BarChart3,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  FileText,
  History,
  LayoutDashboard,
  Package,
  Settings,
  Star,
  Syringe,
  Users,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface SidebarNavProps {
  userRole: string
  canViewStock: boolean
  canViewFinancial: boolean
  canViewEvaluations: boolean
  canViewCollections: boolean
  canViewReports: boolean
  canViewLogs: boolean
  canViewSettings: boolean
}

export function SidebarNav({
  userRole,
  canViewStock,
  canViewFinancial,
  canViewEvaluations,
  canViewCollections,
  canViewReports,
  canViewLogs,
  canViewSettings,
}: SidebarNavProps) {
  const pathname = usePathname()

  const isStockActive =
    pathname.startsWith('/transactions') || pathname.startsWith('/items')
  const isFinancialActive = pathname.startsWith('/cash-closures')
  const isRhActive =
    pathname.startsWith('/evaluations') || pathname.startsWith('/hr-reports')

  const [isStockOpen, setIsStockOpen] = useState(true)
  const [isFinancialOpen, setIsFinancialOpen] = useState(true)
  const [isRhOpen, setIsRhOpen] = useState(true)

  return (
    <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
      {/* Visão Geral */}
      {userRole !== 'INVENTORY' && userRole !== 'ANALYST' && (
        <Link
          href="/"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname === '/'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          <span>Visão Geral</span>
        </Link>
      )}

      {/* Menu Colapsável: ESTOQUE */}
      {canViewStock && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setIsStockOpen((prev) => !prev)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              isStockActive
                ? 'text-primary bg-primary/5'
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Boxes className="h-4 w-4 text-primary shrink-0" />
              <span>Estoque</span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isStockOpen ? 'rotate-0' : '-rotate-90 text-on-surface-variant/60'
              }`}
            />
          </button>

          {isStockOpen && (
            <div className="pl-4 pr-1 space-y-1 animate-in fade-in-50 duration-150">
              <Link
                href="/transactions"
                className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  pathname.startsWith('/transactions')
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
                }`}
              >
                <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
                <span>Transações</span>
              </Link>
              <Link
                href="/items"
                className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  pathname.startsWith('/items')
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
                }`}
              >
                <Package className="h-3.5 w-3.5 shrink-0" />
                <span>Catálogo de Itens</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Menu Colapsável: FINANCEIRO */}
      {canViewFinancial && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setIsFinancialOpen((prev) => !prev)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              isFinancialActive
                ? 'text-primary bg-primary/5'
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CircleDollarSign className="h-4 w-4 text-primary shrink-0" />
              <span>Financeiro</span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isFinancialOpen ? 'rotate-0' : '-rotate-90 text-on-surface-variant/60'
              }`}
            />
          </button>

          {isFinancialOpen && (
            <div className="pl-4 pr-1 space-y-1 animate-in fade-in-50 duration-150">
              <Link
                href="/cash-closures"
                className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  pathname.startsWith('/cash-closures')
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
                }`}
              >
                <Wallet className="h-3.5 w-3.5 shrink-0" />
                <span>Fechamentos</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Menu Colapsável: RH */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setIsRhOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
            isRhActive
              ? 'text-primary bg-primary/5'
              : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <span>RH</span>
          </div>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              isRhOpen ? 'rotate-0' : '-rotate-90 text-on-surface-variant/60'
            }`}
          />
        </button>

        {isRhOpen && (
          <div className="pl-4 pr-1 space-y-1 animate-in fade-in-50 duration-150">
            {canViewEvaluations && (
              <Link
                href="/evaluations"
                className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  pathname.startsWith('/evaluations')
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
                }`}
              >
                <Star className="h-3.5 w-3.5 shrink-0" />
                <span>Meus Atendimentos</span>
              </Link>
            )}
            <Link
              href="/hr-reports"
              className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                pathname.startsWith('/hr-reports')
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
              }`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span>Relatórios dos Setores</span>
            </Link>
          </div>
        )}
      </div>

      {/* Módulos Operacionais Adicionais */}
      {(canViewCollections || canViewReports || canViewLogs) && (
        <div className="space-y-1 pt-2 border-t border-surface-container/60">
          {canViewCollections && (
            <Link
              href="/collections"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                pathname.startsWith('/collections')
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
              }`}
            >
              <Syringe className="h-4 w-4 shrink-0" />
              <span>Recoletas</span>
            </Link>
          )}
          {canViewReports && (
            <Link
              href="/reports"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                pathname.startsWith('/reports')
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
              }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>
                {userRole === 'FISCAL' ? 'Relatório Recoletas' : 'Relatórios Analíticos'}
              </span>
            </Link>
          )}
          {canViewLogs && (
            <Link
              href="/logs"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                pathname.startsWith('/logs')
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
              }`}
            >
              <History className="h-4 w-4 shrink-0" />
              <span>Logs de Auditoria</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
