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
import { createItemAction } from './actions'

export function CreateItemDialog() {
  const [open, setOpen] = useState(false)

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      const result = await createItemAction(formData)
      if (result.success) {
        setOpen(false)
      }
      return result
    },
    { success: false, message: null }
  )

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
          Novo Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar ao Catálogo</DialogTitle>
          <DialogDescription>
            Crie um novo item, produto ou procedimento.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Item</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ex: Luvas de Procedimento (Caixa)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Ex: Caixa com 100 unidades"
            />
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
              {isPending ? 'Salvando...' : 'Salvar Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
