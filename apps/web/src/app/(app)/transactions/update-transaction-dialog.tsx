'use client'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Item } from '@/http/get-items'
import type { Transaction } from '@/http/get-transactions'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { updateTransactionAction } from './actions'

import type { Sector } from '@/http/get-sectors'

interface Props {
  transaction: Transaction | null
  items: Item[]
  sectors: Sector[]
  onClose: () => void
}

export function UpdateTransactionDialog({
  transaction,
  items,
  sectors,
  onClose,
}: Props) {
  const [valueMask, setValueMask] = useState('')
  const [selectedSector, setSelectedSector] = useState<string>('')
  const [date, setDate] = useState('')

  const open = transaction !== null

  useEffect(() => {
    if (transaction) {
      setValueMask(
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(transaction.value)
      )
      setSelectedSector(transaction.sectorId || '')
      const dateObj = new Date(transaction.date)
      const dateString = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
      setDate(dateString)
    }
  }, [transaction, items])

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      if (!transaction) return prevState
      const result = await updateTransactionAction(transaction.id, formData)
      if (result.success) {
        toast.success('Transação atualizada com sucesso!')
        onClose()
      } else if (result.message) {
        toast.error(result.message)
      }
      return result
    },
    { success: false, message: null }
  )

  if (!transaction) return null

  const displayItems = items

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
          <DialogDescription>
            Ajuste os valores ou data desta transação.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="update-type">Tipo</Label>
              <select
                id="update-type"
                name="type"
                required
                defaultValue={transaction.type}
                className="h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
              >
                <option value="ENTRY">Entrada (Compra/Reposição)</option>
                <option value="EXIT">Saída (Consumo/Venda)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-date">Data</Label>
              <DatePicker
                id="update-date"
                name="date"
                value={date}
                onChange={setDate}
                outputFormat="YYYY-MM-DD"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="update-sectorId">Setor</Label>
            <select
              id="update-sectorId"
              name="sectorId"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
            >
              <option value="">Todos os Setores</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="update-itemId">Item do Catálogo</Label>
            <select
              id="update-itemId"
              name="itemId"
              required
              defaultValue={transaction.itemId}
              className="h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
            >
              {displayItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="update-quantity">Quantidade</Label>
              <Input
                id="update-quantity"
                name="quantity"
                type="number"
                min="1"
                required
                defaultValue={transaction.quantity}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-valueMasked">Valor Unitário (R$)</Label>
              <Input
                id="update-valueMasked"
                name="valueMasked"
                type="text"
                required
                value={valueMask}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  if (val === '') {
                    setValueMask('')
                    return
                  }
                  const num = Number(val) / 100
                  setValueMask(
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(num)
                  )
                }}
              />
              <input
                type="hidden"
                name="value"
                value={valueMask.replace(/\D/g, '')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-transparent text-on-surface hover:bg-surface-container cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
