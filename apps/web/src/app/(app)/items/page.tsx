import { auth } from '@/auth/auth'
import { getCategories, type Category } from '@/http/get-categories'
import { getItems, type Item } from '@/http/get-items'
import type { Metadata } from 'next'
import { CreateItemDialog } from './create-item-dialog'
import { ItemsContent } from './items-content'

export const metadata: Metadata = {
  title: 'Catálogo de Itens - Master Admin',
  description: 'Gerencie os itens e procedimentos do catálogo global.',
}

export default async function ItemsPage() {
  const { user, token } = await auth()

  const canManage = user.role === 'ADMIN' || user.role === 'INVENTORY'

  let items: Item[] = []
  let pagination = { page: 1, perPage: 20, totalCount: 0, totalPages: 1 }
  let categories: Category[] = []

  try {
    const [itemsRes, categoriesRes] = await Promise.all([
      getItems(token, { page: 1, perPage: 20 }).catch(() => ({
        items: [],
        pagination: { page: 1, perPage: 20, totalCount: 0, totalPages: 1 },
      })),
      getCategories(token).catch(() => ({ categories: [] })),
    ])

    items = itemsRes.items
    pagination = itemsRes.pagination
    categories = categoriesRes.categories
  } catch (err) {
    console.error('Error loading items page data:', err)
  }

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
        {canManage && <CreateItemDialog categories={categories} />}
      </div>

      <ItemsContent
        initialItems={items}
        initialPagination={pagination}
        categories={categories}
        canManage={canManage}
      />
    </div>
  )
}
