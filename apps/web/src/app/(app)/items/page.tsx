import { auth } from '@/auth/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getItems } from '@/http/get-items'
import type { Metadata } from 'next'
import { CreateItemDialog } from './create-item-dialog'
import { UpdateItemDialog } from './update-item-dialog'
import { getSectors } from '@/http/get-sectors'
import type { Sector } from '@/http/get-sectors'

export const metadata: Metadata = {
  title: 'Catálogo de Itens - Master Admin',
  description: 'Gerencie os itens e procedimentos do catálogo global.',
}

export default async function ItemsPage() {
  const { user, token } = await auth()
  const { items } = await getItems(token)

  const canManage = user.role === 'ADMIN' || user.role === 'INVENTORY'

  // Fetch sectors to pass to item dialogs
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Itens Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-on-surface-variant py-8 text-center">
              Nenhum item no catálogo.
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-highest text-on-surface text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Nome</th>
                    <th className="px-6 py-3 font-semibold">Descrição</th>
                    <th className="px-6 py-3 font-semibold">Setor</th>
                    <th className="px-6 py-3 text-right font-semibold">
                      Qtd. Inicial
                    </th>
                    <th className="px-6 py-3 text-right font-semibold">
                      Data de Cadastro
                    </th>
                    {canManage && (
                      <th className="px-6 py-3 text-right font-semibold">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-surface-container divide-y">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-container-lowest transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      <td className="text-on-surface-variant px-6 py-4">
                        {item.description || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {item.sector?.name ? (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {item.sector.name}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant text-xs italic">
                            Sem Setor
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <UpdateItemDialog item={item} sectors={sectors} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
