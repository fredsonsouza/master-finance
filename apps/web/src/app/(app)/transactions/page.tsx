import { auth } from '@/auth/auth'
import { getTransactions } from '@/http/get-transactions'
import { getItems } from '@/http/get-items'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { CreateTransactionDialog } from './create-transaction-dialog'

export default async function TransactionsPage() {
  const { token } = await auth()
  
  // Fetch paralelamente para velocidade máxima!
  const [{ transactions }, { items }] = await Promise.all([
    getTransactions(token),
    getItems(token),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">Transações</h1>
          <p className="text-on-surface-variant">
            Gerencie o fluxo financeiro e de itens.
          </p>
        </div>
        <CreateTransactionDialog items={items} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">
              Nenhuma transação encontrada.
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-highest text-on-surface uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Tipo</th>
                    <th className="px-6 py-3 font-semibold">Data</th>
                    <th className="px-6 py-3 font-semibold">Mês</th>
                    <th className="px-6 py-3 font-semibold">Qtd</th>
                    <th className="px-6 py-3 font-semibold text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-medium">
                          {tx.type === 'ENTRY' ? (
                            <><ArrowUpCircle className="h-4 w-4 text-success" /> Entrada</>
                          ) : (
                            <><ArrowDownCircle className="h-4 w-4 text-error" /> Saída</>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">{tx.month}</td>
                      <td className="px-6 py-4">{tx.quantity}</td>
                      <td className="px-6 py-4 text-right font-medium tabular-nums">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.value)}
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
