'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Item } from '@/http/get-items'
import type { Sector } from '@/http/get-sectors'
import type { Transaction, TransactionPagination } from '@/http/get-transactions'
import type { Unit } from '@/http/get-units'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  Pencil,
  RotateCw,
  Search,
  Trash2,
} from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { deleteTransactionAction, fetchTransactionsAction } from './actions'
import { UpdateTransactionDialog } from './update-transaction-dialog'

interface Props {
  initialTransactions: Transaction[]
  initialPagination: TransactionPagination
  items: Item[]
  sectors: Sector[]
  units?: Unit[]
}

export function TransactionsContent({
  initialTransactions,
  initialPagination,
  items,
  sectors,
  units = [],
}: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [pagination, setPagination] = useState<TransactionPagination>(initialPagination)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [unitFilter, setUnitFilter] = useState<string>('ALL')
  const [isLoading, startTransition] = useTransition()

  // States for Edit/Delete actions
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const hasUnitData = transactions.some((tx) => tx.unit)

  function loadTransactions(
    page: number = 1,
    overrides?: { unitId?: string; type?: string; search?: string }
  ) {
    const activeUnitId = overrides?.unitId !== undefined ? overrides.unitId : unitFilter
    const activeType = overrides?.type !== undefined ? overrides.type : typeFilter
    const activeSearch = overrides?.search !== undefined ? overrides.search : search

    startTransition(async () => {
      const res = await fetchTransactionsAction({
        page,
        perPage: 20,
        unitId: activeUnitId,
        type: activeType,
        search: activeSearch,
      })
      setTransactions(res.transactions)
      setPagination(res.pagination)
    })
  }

  // Debounced server search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTransactions(1, { search })
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  function handleUnitChange(val: string) {
    setUnitFilter(val)
    loadTransactions(1, { unitId: val })
  }

  function handleTypeChange(val: string) {
    setTypeFilter(val)
    loadTransactions(1, { type: val })
  }

  async function confirmDelete() {
    if (!deletingTx) return
    setIsDeleting(true)
    const result = await deleteTransactionAction(deletingTx.id)
    if (result.success) {
      toast.success('Transação excluída com sucesso!')
      setDeletingTx(null)
      loadTransactions(pagination.page)
    } else {
      toast.error(result.message || 'Erro ao excluir.')
    }
    setIsDeleting(false)
  }

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative w-full flex-1">
          <Search className="text-on-surface-variant absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            placeholder="Buscar por item, setor ou unidade..."
            className="bg-surface w-full pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={unitFilter}
          onChange={(e) => handleUnitChange(e.target.value)}
          className="border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none sm:w-48"
        >
          <option value="ALL">Todas as Unidades</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none sm:w-48"
        >
          <option value="ALL">Todas as Transações</option>
          <option value="ENTRY">Apenas Entradas</option>
          <option value="EXIT">Apenas Saídas</option>
        </select>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Histórico Recente</CardTitle>
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-primary animate-pulse font-medium">
              <RotateCw className="h-3.5 w-3.5 animate-spin" />
              <span>Carregando...</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {transactions.length === 0 ? (
            <div className="text-on-surface-variant py-12 text-center">
              Nenhuma transação encontrada com esses filtros.
            </div>
          ) : (
            <div className="border-t sm:border border-surface-container overflow-hidden sm:rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-highest text-on-surface text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Tipo</th>
                      <th className="px-6 py-3 font-semibold whitespace-nowrap">Data</th>
                      {hasUnitData && (
                        <th className="px-6 py-3 font-semibold whitespace-nowrap">Unidade</th>
                      )}
                      <th className="px-6 py-3 font-semibold">Setor</th>
                      <th className="px-6 py-3 font-semibold">Item</th>
                      <th className="px-6 py-3 font-semibold">Qtd</th>
                      <th className="px-6 py-3 text-right font-semibold whitespace-nowrap">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-right font-semibold whitespace-nowrap">
                        Total
                      </th>
                      <th className="px-6 py-3 text-right font-semibold whitespace-nowrap">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-surface-container divide-y">
                    {transactions.map((tx) => {
                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-surface-container-lowest transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 font-medium">
                              {tx.type === 'ENTRY' ? (
                                <>
                                  <ArrowUpCircle className="text-success h-4 w-4" />{' '}
                                  Entrada
                                </>
                              ) : (
                                <>
                                  <ArrowDownCircle className="text-error h-4 w-4" />{' '}
                                  Saída
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString('pt-BR')}
                          </td>
                          {hasUnitData && (
                            <td className="px-6 py-4 font-medium text-primary whitespace-nowrap">
                              {tx.unit?.name}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {tx.sector?.name || '-'}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {tx.item.name}
                          </td>
                          <td className="px-6 py-4 font-medium">{tx.quantity}</td>
                          <td className="px-6 py-4 text-right font-medium tabular-nums whitespace-nowrap">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(tx.value)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold tabular-nums whitespace-nowrap">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(tx.value * tx.quantity)}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-on-surface hover:text-primary h-8 w-8 cursor-pointer"
                                onClick={() => setEditingTx(tx)}
                                title="Editar Transação"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-on-surface hover:text-error h-8 w-8 cursor-pointer"
                                onClick={() => setDeletingTx(tx)}
                                title="Excluir Transação"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-surface-container bg-surface-container-lowest text-xs text-on-surface-variant">
                  <span>
                    Página <strong>{pagination.page}</strong> de{' '}
                    <strong>{pagination.totalPages}</strong> ({pagination.totalCount} transações)
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1 || isLoading}
                      onClick={() => loadTransactions(pagination.page - 1)}
                      className="h-7 px-2 cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages || isLoading}
                      onClick={() => loadTransactions(pagination.page + 1)}
                      className="h-7 px-2 cursor-pointer"
                    >
                      Próxima
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <UpdateTransactionDialog
        transaction={editingTx}
        items={items}
        sectors={sectors}
        onClose={() => {
          setEditingTx(null)
          loadTransactions(pagination.page)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deletingTx !== null}
        onOpenChange={(val) => !val && setDeletingTx(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir esta transação
              permanentemente? Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingTx(null)}
              className="cursor-pointer"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              className="bg-error hover:bg-error/90 text-on-error cursor-pointer"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
