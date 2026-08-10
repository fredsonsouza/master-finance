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
import type { Transaction } from '@/http/get-transactions'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { deleteTransactionAction } from './actions'
import { UpdateTransactionDialog } from './update-transaction-dialog'

import type { Sector } from '@/http/get-sectors'
import type { Unit } from '@/http/get-units'

interface Props {
  transactions: Transaction[]
  items: Item[]
  sectors: Sector[]
  units?: Unit[]
}

export function TransactionsContent({ transactions, items, sectors, units = [] }: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [unitFilter, setUnitFilter] = useState<string>('ALL')
  const hasUnitData = transactions.some((tx) => tx.unit)

  // States for Edit/Delete actions
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtering
  const filtered = transactions.filter((tx) => {
    // Busca por nome de item, setor ou unidade
    const itemName = tx.item.name.toLowerCase()
    const sectorName = tx.sector?.name.toLowerCase() || ''
    const unitName = tx.unit?.name.toLowerCase() || ''
    const matchesSearch =
      itemName.includes(search.toLowerCase()) ||
      sectorName.includes(search.toLowerCase()) ||
      unitName.includes(search.toLowerCase())

    // Filtro de Tipo
    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter

    // Filtro de Unidade
    const matchesUnit = unitFilter === 'ALL' || tx.unitId === unitFilter

    return matchesSearch && matchesType && matchesUnit
  })

  async function confirmDelete() {
    if (!deletingTx) return
    setIsDeleting(true)
    const result = await deleteTransactionAction(deletingTx.id)
    if (result.success) {
      toast.success('Transação excluída com sucesso!')
      setDeletingTx(null)
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
          onChange={(e) => setUnitFilter(e.target.value)}
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
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none sm:w-48"
        >
          <option value="ALL">Todas as Transações</option>
          <option value="ENTRY">Apenas Entradas</option>
          <option value="EXIT">Apenas Saídas</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-on-surface-variant py-8 text-center">
              Nenhuma transação encontrada com esses filtros.
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-highest text-on-surface text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Tipo</th>
                    <th className="px-6 py-3 font-semibold">Data</th>
                    {hasUnitData && (
                      <th className="px-6 py-3 font-semibold">Unidade</th>
                    )}
                    <th className="px-6 py-3 font-semibold">Setor</th>
                    <th className="px-6 py-3 font-semibold">Item</th>
                    <th className="px-6 py-3 font-semibold">Qtd</th>
                    <th className="px-6 py-3 text-right font-semibold">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-right font-semibold">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right font-semibold">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-surface-container divide-y">
                  {filtered.map((tx) => {
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-surface-container-lowest transition-colors"
                      >
                        <td className="px-6 py-4">
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
                          <td className="px-6 py-4 font-medium text-primary">
                            {tx.unit?.name}
                          </td>
                        )}
                        <td className="px-6 py-4">
                          {tx.sector?.name || '-'}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {tx.item.name}
                        </td>
                        <td className="px-6 py-4">{tx.quantity}</td>
                        <td className="px-6 py-4 text-right font-medium tabular-nums">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(tx.value)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold tabular-nums">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(tx.value * tx.quantity)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-on-surface hover:text-primary h-8 w-8 cursor-pointer"
                              onClick={() => setEditingTx(tx)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-on-surface hover:text-error h-8 w-8 cursor-pointer"
                              onClick={() => setDeletingTx(tx)}
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
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <UpdateTransactionDialog
        transaction={editingTx}
        items={items}
        sectors={sectors}
        onClose={() => setEditingTx(null)}
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
