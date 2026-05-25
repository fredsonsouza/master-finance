import { auth } from '@/auth/auth'

export async function Header() {
  const { user } = await auth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-container bg-surface px-6">
      <div className="flex items-center gap-4">
        {/* Espaço reservado para Breadcrumbs ou Título da Página atual */}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-on-surface">{user.name || user.username}</p>
          <p className="text-xs text-on-surface-variant">{user.role}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
          {(user.name || user.username || 'U').charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
