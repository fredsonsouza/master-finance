import { auth } from '@/auth/auth'
import { getItems } from '@/http/get-items'
import { getSectors } from '@/http/get-sectors'
import { getUnits } from '@/http/get-units'
import { getTransactions } from '@/http/get-transactions'
import { CreateTransactionDialog } from './create-transaction-dialog'
import { TransactionsContent } from './transactions-content'

export default async function TransactionsPage() {
  const { token } = await auth()

  // Fetch paralelamente para velocidade máxima!
  const [{ transactions }, { items }, { sectors }, { units }] = await Promise.all([
    getTransactions(token),
    getItems(token),
    getSectors(token),
    getUnits(token).catch(() => ({ units: [] })),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-primary text-3xl font-bold">
            Transações
          </h1>
          <p className="text-on-surface-variant">
            Gerencie o fluxo financeiro e de itens.
          </p>
        </div>
        <CreateTransactionDialog
          items={items}
          sectors={sectors}
          units={units}
        />
      </div>

      <TransactionsContent
        transactions={transactions}
        items={items}
        sectors={sectors}
        units={units}
      />
    </div>
  )
}
