import {
  ArrowRightLeft,
  BarChart3,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Star,
  Syringe,
  Wallet,
} from 'lucide-react'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '@/auth/auth'

async function logout() {
  'use server'
  const cookieStore = await cookies()
  cookieStore.delete('token')
  redirect('/auth/sign-in')
}

export async function Sidebar() {
  const { user } = await auth()

  return (
    <aside className="w-64 border-r border-surface-container bg-surface flex flex-col">
      <div className="p-6">
        <h1 className="font-display text-2xl font-bold text-primary">
          Master Admin
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {(user.role === 'ADMIN' ||
          user.role === 'MANAGER' ||
          user.role === 'INVENTORY') && (
          <>
            {user.role !== 'INVENTORY' && (
              <Link
                href="/"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="font-medium">Visão Geral</span>
              </Link>
            )}
            <Link
              href="/transactions"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors"
            >
              <ArrowRightLeft className="h-5 w-5" />
              <span className="font-medium">Transações</span>
            </Link>
            <Link
              href="/items"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors"
            >
              <Package className="h-5 w-5" />
              <span className="font-medium">Catálogo de Itens</span>
            </Link>
          </>
        )}
        {(user.role === 'ADMIN' ||
          user.role === 'MANAGER' ||
          user.role === 'SELLER') && (
          <Link
            href="/evaluations"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors"
          >
            <Star className="h-5 w-5" />
            <span className="font-medium">Meus Atendimentos</span>
          </Link>
        )}
        {(user.role === 'ADMIN' ||
          user.role === 'MANAGER' ||
          user.role === 'FISCAL' ||
          user.role === 'COLLECTOR') && (
          <Link
            href="/collections"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors"
          >
            <Syringe className="h-5 w-5" />
            <span className="font-medium">Recoletas</span>
          </Link>
        )}
        {(user.role === 'ADMIN' ||
          user.role === 'MANAGER' ||
          user.role === 'FINANCIAL' ||
          user.role === 'SELLER') && (
          <Link
            href="/cash-closures"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors"
          >
            <Wallet className="h-5 w-5" />
            <span className="font-medium">Fechamentos</span>
          </Link>
        )}
        {(user.role === 'ADMIN' ||
          user.role === 'MANAGER' ||
          user.role === 'FISCAL') && (
          <Link
            href="/reports"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="font-medium">
              {user.role === 'FISCAL' ? 'Relatório Recoletas' : 'Relatórios'}
            </span>
          </Link>
        )}
        {user.role === 'ADMIN' && (
          <Link
            href="/logs"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors"
          >
            <History className="h-5 w-5" />
            <span className="font-medium">Logs de Auditoria</span>
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-surface-container">
        {(user.role === 'ADMIN' ||
          user.role === 'MANAGER' ||
          user.role === 'INVENTORY') && (
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors mb-2"
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Configurações</span>
          </Link>
        )}
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-error hover:bg-error-container transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sair</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
