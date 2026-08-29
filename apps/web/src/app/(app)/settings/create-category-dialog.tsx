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
import { Loader2, Plus, Tag } from 'lucide-react'
import { useActionState, useState } from 'react'
import { toast } from 'sonner'
import { createCategoryAction } from './actions'

export function CreateCategoryDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      const result = await createCategoryAction(formData)
      if (result.success) {
        toast.success('Categoria criada com sucesso!')
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
        <Button className="gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Tag className="text-primary h-5 w-5" />
            <DialogTitle>Criar Categoria</DialogTitle>
          </div>
          <DialogDescription>
            Adicione uma nova categoria para classificar os itens do catálogo.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex: Medicamentos, Descartáveis, Equipamentos"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Categoria
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
