'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Sector } from '@/http/get-sectors'
import { useActionState, useState } from 'react'
import { toast } from 'sonner'
import { updateSectorAction } from './actions'

interface UpdateSectorDialogProps {
  sector: Sector | null
  onClose: () => void
}

export function UpdateSectorDialog({
  sector,
  onClose,
}: UpdateSectorDialogProps) {
  const open = sector !== null

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      if (!sector) return prevState
      const result = await updateSectorAction(sector.id, formData)
      if (result.success) {
        toast.success('Setor atualizado com sucesso!')
        onClose()
      } else if (result.message) {
        toast.error(result.message)
      }
      return result
    },
    { success: false, message: null }
  )

  if (!sector) return null

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Setor</DialogTitle>
          <DialogDescription>
            Altere o nome do setor selecionado.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="update-sector-name">Nome do Setor</Label>
            <Input
              id="update-sector-name"
              name="name"
              required
              defaultValue={sector.name}
            />
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
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
