'use client'

import {
  ArrowRightLeft,
  BarChart3,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  FileCheck2,
  FileText,
  FlaskConical,
  History,
  IdCard,
  LayoutDashboard,
  Package,
  Settings,
  SlidersHorizontal,
  Star,
  Syringe,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface SidebarNavProps {
  canViewDashboard: boolean
  canViewStock: boolean
  canViewTransactions: boolean
  canViewItems: boolean
  canViewFinancial: boolean
  canViewEvaluations: boolean
  canViewCollections: boolean
  canViewReports: boolean
  onlyCollectionsReports: boolean
  canManageEmployees: boolean
  canViewSettings: boolean
  canViewLogs: boolean
}

export function SidebarNav({
  canViewDashboard,
  canViewStock,
  canViewTransactions,
  canViewItems,
  canViewFinancial,
  canViewEvaluations,
  canViewCollections,
  canViewReports,
  onlyCollectionsReports,
  canManageEmployees,
  canViewSettings,
  canViewLogs,
}: SidebarNavProps) {
  const pathname = usePathname()

  const isStockActive =
    pathname.startsWith('/transactions') ||
    pathname.startsWith('/items') ||
    pathname.startsWith('/reports')
  const isFinancialActive = pathname.startsWith('/cash-closures')
  const isEmployeesActive = pathname.startsWith('/employees')
  const isRhActive =
    pathname.startsWith('/evaluations') ||
    pathname.startsWith('/hr-reports') ||
    isEmployeesActive
  const isLabActive = pathname.startsWith('/collections')
  const isSettingsActive =
    pathname.startsWith('/settings') || pathname.startsWith('/logs')

  const [isStockOpen, setIsStockOpen] = useState(false)
  const [isFinancialOpen, setIsFinancialOpen] = useState(false)
  const [isRhOpen, setIsRhOpen] = useState(false)
  const [isEmployeesOpen, setIsEmployeesOpen] = useState(false)
  const [isLabOpen, setIsLabOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
      {/* Visão Geral */}
      {canViewDashboard && (
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
                isStockOpen
                  ? 'rotate-0'
                  : '-rotate-90 text-on-surface-variant/60'
              }`}
            />
          </button>

          {isStockOpen && (
            <div className="pl-4 pr-1 space-y-1 animate-in fade-in-50 duration-150">
              {canViewTransactions && (
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
              )}
              {canViewItems && (
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
              )}
              {canViewReports && (
                <Link
                  href="/reports"
                  className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    pathname.startsWith('/reports')
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {onlyCollectionsReports
                      ? 'Relatório Recoletas'
                      : 'Relatórios Analíticos'}
                  </span>
                </Link>
              )}
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
                isFinancialOpen
                  ? 'rotate-0'
                  : '-rotate-90 text-on-surface-variant/60'
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
                <span>Atendimentos</span>
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
              <span>Relatórios de Atividades</span>
            </Link>

            {/* Submenu aninhado: Colaboradores */}
            <div className="space-y-1 pt-0.5">
              <button
                type="button"
                onClick={() => setIsEmployeesOpen((prev) => !prev)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isEmployeesActive
                    ? 'text-primary font-semibold bg-primary/10'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IdCard className="h-3.5 w-3.5 shrink-0" />
                  <span>Colaboradores</span>
                </div>
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${
                    isEmployeesOpen
                      ? 'rotate-0'
                      : '-rotate-90 text-on-surface-variant/60'
                  }`}
                />
              </button>

              {isEmployeesOpen && (
                <div className="pl-4 pr-1 space-y-1 border-l border-surface-container ml-3 animate-in fade-in-50 duration-150">
                  {canManageEmployees && (
                    <Link
                      href="/employees"
                      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        pathname === '/employees'
                          ? 'bg-primary/15 text-primary font-semibold'
                          : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Quadro de Colaboradores</span>
                    </Link>
                  )}

                  <Link
                    href="/employees/requests"
                    className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      pathname.startsWith('/employees/requests')
                        ? 'bg-primary/15 text-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
                    }`}
                  >
                    <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {canManageEmployees
                        ? 'Solicitações e Documentos'
                        : 'Minhas Solicitações'}
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Menu Colapsável: LABORATÓRIO */}
      {canViewCollections && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setIsLabOpen((prev) => !prev)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              isLabActive
                ? 'text-primary bg-primary/5'
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FlaskConical className="h-4 w-4 text-primary shrink-0" />
              <span>Laboratório</span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isLabOpen ? 'rotate-0' : '-rotate-90 text-on-surface-variant/60'
              }`}
            />
          </button>

          {isLabOpen && (
            <div className="pl-4 pr-1 space-y-1 animate-in fade-in-50 duration-150">
              <Link
                href="/collections"
                className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  pathname.startsWith('/collections')
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
                }`}
              >
                <Syringe className="h-3.5 w-3.5 shrink-0" />
                <span>Recoletas</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Menu Colapsável: CONFIGURAÇÕES */}
      {(canViewSettings || canViewLogs) && (
        <div className="space-y-1 pt-2 border-t border-surface-container/60">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                isSettingsActive
                  ? 'text-primary bg-primary/5'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="h-4 w-4 text-primary shrink-0" />
                <span>Configurações</span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  isSettingsOpen
                    ? 'rotate-0'
                    : '-rotate-90 text-on-surface-variant/60'
                }`}
              />
            </button>

            {isSettingsOpen && (
              <div className="pl-4 pr-1 space-y-1 animate-in fade-in-50 duration-150">
                {canViewSettings && (
                  <Link
                    href="/settings"
                    className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      pathname.startsWith('/settings')
                        ? 'bg-primary/15 text-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
                    <span>Geral e Acessos</span>
                  </Link>
                )}
                {canViewLogs && (
                  <Link
                    href="/logs"
                    className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      pathname.startsWith('/logs')
                        ? 'bg-primary/15 text-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
                    }`}
                  >
                    <History className="h-3.5 w-3.5 shrink-0" />
                    <span>Logs de Auditoria</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
