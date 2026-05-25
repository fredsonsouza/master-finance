'use client'

import { useState, useActionState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { createTransactionAction } from './actions'
import type { Item } from '@/http/get-items'

interface Props {
  items: Item[]
}

export function CreateTransactionDialog({ items }: Props) {
  const [open, setOpen] = useState(false)

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      const result = await createTransactionAction(formData)
      if (result.success) {
        setOpen(false)
      }
      return result
    },
    { success: false, message: null }
  )

  // Reset form messages when opened/closed
  useEffect(() => {
    if (!open && state.message) {
      state.message = null
    }
  }, [open, state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Transação</DialogTitle>
          <DialogDescription>
            Insira os detalhes de entrada ou saída para o item selecionado.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                required
                className="h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
              >
                <option value="ENTRY">Entrada (Compra/Reposição)</option>
                <option value="EXIT">Saída (Consumo/Venda)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data (Opcional)</Label>
              <Input id="date" name="date" type="datetime-local" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemId">Item do Catálogo</Label>
            <select
              id="itemId"
              name="itemId"
              required
              className="h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
            >
              <option value="">Selecione um item...</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                required
                placeholder="Ex: 10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Valor Total (R$)</Label>
              <Input
                id="value"
                name="value"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="Ex: 150.00"
              />
            </div>
          </div>

          {state.message && !state.success && (
            <div className="bg-error-container text-on-error-container rounded-md p-3 text-sm">
              {state.message}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-transparent text-on-surface hover:bg-surface-container"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar Transação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
