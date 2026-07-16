/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/auth/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getActiveUnit } from '@/components/unit-switcher-action'
import { getDashboardMetrics } from '@/http/get-dashboard-metrics'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { user, token } = await auth()

  if (['FINANCIAL', 'SELLER'].includes(user.role)) {
    redirect('/cash-closures')
  }

  if (['COLLECTOR', 'FISCAL'].includes(user.role)) {
    redirect('/collections')
  }

  const activeUnitId = await getActiveUnit()

  let groups: any[] = []
  let balance = 0
  let entries = 0
  let exits = 0

  try {
    const res = await getDashboardMetrics(token, activeUnitId)
    groups = res.groups
    balance = res.totalBalance
    entries = res.totalEntries
    exits = res.totalExits
  } catch (err) {
    console.error(err)
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)

  return (
    <div className="space-y-6">
      <h1 className="font-display text-primary text-3xl font-bold">
        Olá, {user.name || user.username}
      </h1>
      <p className="text-on-surface-variant">
        Bem-vindo de volta ao Master Admin.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saldo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${balance >= 0 ? 'text-success' : 'text-error'}`}
            >
              {formatCurrency(balance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total de Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-success text-2xl font-bold">
              {formatCurrency(entries)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total de Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-error text-2xl font-bold">
              {formatCurrency(exits)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="pt-6">
        <h2 className="font-display text-primary mb-4 text-xl font-semibold">
          {activeUnitId ? 'Totais por Setor' : 'Totais por Unidade'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group: any) => (
            <Card
              key={group.id}
              className="bg-surface-container-lowest border-surface-container"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-md text-on-surface truncate pb-1">
                  {group.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Entradas:</span>
                  <span className="text-success font-medium">
                    {formatCurrency(group.entries)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Saídas:</span>
                  <span className="text-error font-medium">
                    {formatCurrency(group.exits)}
                  </span>
                </div>
                <div className="border-surface-container mt-1 flex justify-between border-t pt-1 text-sm font-semibold">
                  <span>Saldo:</span>
                  <span
                    className={
                      group.balance >= 0 ? 'text-success' : 'text-error'
                    }
                  >
                    {formatCurrency(group.balance)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {groups.length === 0 && (
            <div className="text-on-surface-variant col-span-full py-4 text-sm">
              Nenhuma transação registrada para compor saldos.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
