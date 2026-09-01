import { auth } from '@/auth/auth'
import { getAllItems, type Item } from '@/http/get-items'
import { getSectors, type Sector } from '@/http/get-sectors'
import {
  getTransactions,
  type Transaction,
  type TransactionPagination,
} from '@/http/get-transactions'
import { getUnits, type Unit } from '@/http/get-units'
import { CreateTransactionDialog } from './create-transaction-dialog'
import { TransactionsContent } from './transactions-content'

export default async function TransactionsPage() {
  const { token } = await auth()

  let transactions: Transaction[] = []
  let pagination: TransactionPagination = {
    page: 1,
    perPage: 20,
    totalCount: 0,
    totalPages: 1,
  }
  let items: Item[] = []
  let sectors: Sector[] = []
  let units: Unit[] = []

  try {
    const [txRes, allItemsList, sectorsRes, unitsRes] = await Promise.all([
      getTransactions(token, { page: 1, perPage: 20 }).catch(() => ({
        transactions: [],
        pagination: { page: 1, perPage: 20, totalCount: 0, totalPages: 1 },
      })),
      getAllItems(token).catch(() => []),
      getSectors(token).catch(() => ({ sectors: [] })),
      getUnits(token).catch(() => ({ units: [] })),
    ])

    transactions = txRes.transactions || []
    pagination = txRes.pagination || {
      page: 1,
      perPage: 20,
      totalCount: transactions.length,
      totalPages: 1,
    }
    items = allItemsList || []
    sectors = sectorsRes.sectors || []
    units = unitsRes.units || []
  } catch (err) {
    console.error('Error loading transactions page data:', err)
  }

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
        initialTransactions={transactions}
        initialPagination={pagination}
        items={items}
        sectors={sectors}
        units={units}
      />
    </div>
  )
}
