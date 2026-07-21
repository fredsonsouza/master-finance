'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Sector } from '@/http/get-sectors'
import type { Item } from '@/http/get-items'
import { Edit } from 'lucide-react'
import { useActionState, useState } from 'react'
import { updateItemAction } from './actions'

interface Props {
  item: Item
  sectors: Sector[]
}

export function UpdateItemDialog({ item, sectors }: Props) {
  const [open, setOpen] = useState(false)

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      const result = await updateItemAction(formData)
      if (result.success) {
        setOpen(false)
      }
      return result
    },
    { success: false, message: null }
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Item do Catálogo</DialogTitle>
          <DialogDescription>
            Atualize as informações deste item ou procedimento.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={item.id} />

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Item</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={item.name}
              placeholder="Ex: Luvas de Procedimento (Caixa)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sectorId">Setor (Opcional)</Label>
            <select
              id="sectorId"
              name="sectorId"
              defaultValue={item.sectorId || ''}
              className="border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
            >
              <option value="">Nenhum / Global</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade (Estoque Inicial)</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              defaultValue={item.quantity}
              placeholder="Ex: 50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Input
              id="description"
              name="description"
              defaultValue={item.description || ''}
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
              {isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
