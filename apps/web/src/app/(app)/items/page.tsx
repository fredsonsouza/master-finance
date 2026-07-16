import { auth } from '@/auth/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getActiveUnit } from '@/components/unit-switcher-action'
import { getItems } from '@/http/get-items'
import type { Metadata } from 'next'
import { CreateItemDialog } from './create-item-dialog'

import { getSectors } from '@/http/get-sectors'
import type { Sector } from '@/http/get-sectors'
import { getUnits } from '@/http/get-units'
import type { Unit } from '@/http/get-units'

export const metadata: Metadata = {
  title: 'Catálogo de Itens - Master Admin',
  description: 'Gerencie os itens e procedimentos da sua unidade.',
}

export default async function ItemsPage() {
  const { token } = await auth()
  const activeUnitId = await getActiveUnit()
  const { items } = await getItems(token, activeUnitId)

  // Fetch sectors to pass to item creation
  let sectors: Sector[] = []
  try {
    const res = await getSectors(token)
    sectors = res.sectors
  } catch {}

  // Fetch units to pass to item creation
  let units: Unit[] = []
  try {
    const res = await getUnits(token)
    units = res.units
  } catch {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-primary text-3xl font-bold">
            Catálogo
          </h1>
          <p className="text-on-surface-variant">
            Gerencie os itens e procedimentos da sua unidade.
          </p>
        </div>
        <CreateItemDialog
          sectors={sectors}
          units={units}
          activeUnitId={activeUnitId}
        />
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
                    {items.some((i) => i.unit) && (
                      <th className="px-6 py-3 font-semibold">Unidade</th>
                    )}
                    <th className="px-6 py-3 font-semibold">Setor</th>
                    <th className="px-6 py-3 text-right font-semibold">
                      Data de Cadastro
                    </th>
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
                      {items.some((i) => i.unit) && (
                        <td className="px-6 py-4 text-primary font-medium">
                          {item.unit?.name}
                        </td>
                      )}
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
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                      </td>
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
