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
import { createUserAction } from './actions'
import type { Unit } from '@/http/get-units'

export function CreateUserDialog({ units, activeUnitId }: { units: Unit[], activeUnitId?: string | null }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await createUserAction(formData)
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
        <Button size="sm" className="h-8 gap-1">
          <Plus className="h-4 w-4" /> Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" name="name" required placeholder="João Silva" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username de Acesso</Label>
            <Input id="username" name="username" required placeholder="joao_silva" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha Inicial</Label>
            <Input id="password" name="password" required type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Cargo</Label>
            <select
              id="role"
              name="role"
              required
              className="h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="EMPLOYEE">Funcionário (Employee)</option>
              <option value="MANAGER">Gerente (Manager)</option>
              <option value="ADMIN">Administrador (Admin)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitId">Unidade (Opcional para Admin)</Label>
            <select
              id="unitId"
              name="unitId"
              defaultValue={activeUnitId || ""}
              className="h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">Acesso Global (Central)</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
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
