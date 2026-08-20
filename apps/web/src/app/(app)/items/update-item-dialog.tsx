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
import type { Category } from '@/http/get-categories'
import type { Item } from '@/http/get-items'
import { Edit, Tag } from 'lucide-react'
import { useActionState, useState } from 'react'
import { toast } from 'sonner'
import { updateItemAction } from './actions'

interface Props {
  item: Item
  categories: Category[]
}

export function UpdateItemDialog({ item, categories }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState(item.categoryId || '')

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      formData.set('categoryId', selectedCategoryId)
      const result = await updateItemAction(formData)
      if (result.success) {
        toast.success('Item atualizado com sucesso!')
        setOpen(false)
      } else if (result.message) {
        toast.error(result.message)
      }
      return result
    },
    { success: false, message: null }
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
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
            <Label htmlFor="categoryId" className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Categoria
            </Label>
            <select
              id="categoryId"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
            >
              <option value="">Nenhuma Categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
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
              className="bg-transparent text-on-surface hover:bg-surface-container cursor-pointer"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="cursor-pointer">
              {isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
