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
import type { Unit } from '@/http/get-units'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { updateUnitAction } from './actions'

interface UpdateUnitDialogProps {
  unit: Unit | null
  onClose: () => void
}

export function UpdateUnitDialog({ unit, onClose }: UpdateUnitDialogProps) {
  const open = unit !== null

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      if (!unit) return prevState
      const result = await updateUnitAction(unit.id, formData)
      if (result.success) {
        toast.success('Unidade atualizada com sucesso!')
        onClose()
      } else if (result.message) {
        toast.error(result.message)
      }
      return result
    },
    { success: false, message: null }
  )

  if (!unit) return null

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Unidade</DialogTitle>
          <DialogDescription>
            Altere o nome da unidade selecionada.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="update-unit-name">Nome da Unidade</Label>
            <Input
              id="update-unit-name"
              name="name"
              required
              defaultValue={unit.name}
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
