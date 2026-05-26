'use client'

import { useState, useActionState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { createUnitAction } from './actions'

export function CreateUnitDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await createUnitAction(formData)
      if (res.success) setOpen(false)
      return res
    },
    { success: false, message: null }
  )

  useEffect(() => {
    if (!open && state.message) state.message = null
  }, [open, state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Plus className="h-4 w-4" /> Nova
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Unidade</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Unidade</Label>
            <Input id="name" name="name" required placeholder="Ex: Clínica Centro" />
          </div>
          {state.message && !state.success && (
            <div className="text-sm text-error bg-error-container p-2 rounded">{state.message}</div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
