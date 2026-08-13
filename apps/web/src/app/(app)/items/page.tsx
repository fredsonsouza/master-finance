import { auth } from '@/auth/auth'
import { getItems } from '@/http/get-items'
import { getSectors, type Sector } from '@/http/get-sectors'
import type { Metadata } from 'next'
import { CreateItemDialog } from './create-item-dialog'
import { ItemsContent } from './items-content'

export const metadata: Metadata = {
  title: 'Catálogo de Itens - Master Admin',
  description: 'Gerencie os itens e procedimentos do catálogo global.',
}

export default async function ItemsPage() {
  const { user, token } = await auth()
  const { items, pagination } = await getItems(token, { page: 1, perPage: 20 })

  const canManage = user.role === 'ADMIN' || user.role === 'INVENTORY'

  // Fetch sectors to pass to item dialogs and filter
  let sectors: Sector[] = []
  try {
    const res = await getSectors(token)
    sectors = res.sectors
  } catch {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-primary text-3xl font-bold">
            Catálogo
          </h1>
          <p className="text-on-surface-variant">
            Gerencie os itens e procedimentos do catálogo global.
          </p>
        </div>
        {canManage && <CreateItemDialog sectors={sectors} />}
      </div>

      <ItemsContent
        initialItems={items}
        initialPagination={pagination}
        sectors={sectors}
        canManage={canManage}
      />
    </div>
  )
}
