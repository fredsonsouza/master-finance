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
import { Plus } from 'lucide-react'
import { useActionState, useState } from 'react'
import { createSectorAction } from './actions'

import { toast } from 'sonner'

export function CreateSectorDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const res = await createSectorAction(formData)
      if (res.success) {
        toast.success('Setor criado com sucesso!')
        setOpen(false)
      } else if (res.message) {
        toast.error(res.message)
      }
      return res
    },
    { success: false, message: null }
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Setor</DialogTitle>
          <DialogDescription className="sr-only">
            Preencha os dados do novo setor.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Setor</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ex: Odontologia"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
