import Link from 'next/link'
import { LayoutDashboard, ArrowRightLeft, Package, Settings, LogOut } from 'lucide-react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function logout() {
  'use server'
  const cookieStore = await cookies()
  cookieStore.delete('token')
  redirect('/auth/sign-in')
}

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-surface-container bg-surface flex flex-col">
      <div className="p-6">
        <h1 className="font-display text-2xl font-bold text-primary">Master Finance</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <Link 
          href="/" 
          className="flex items-center gap-3 rounded-md px-3 py-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors"
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="font-medium">Visão Geral</span>
        </Link>
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
      </nav>

      <div className="p-4 border-t border-surface-container">
        <Link 
          href="/settings" 
          className="flex items-center gap-3 rounded-md px-3 py-2 text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors mb-2"
        >
          <Settings className="h-5 w-5" />
          <span className="font-medium">Configurações</span>
        </Link>
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
