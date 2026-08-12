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
import type { Unit } from '@/http/get-units'
import { Plus } from 'lucide-react'
import { useActionState, useEffect, useState } from 'react'
import { createUserAction } from './actions'

import { toast } from 'sonner'

export function CreateUserDialog({
  units,
  activeUnitId,
  currentUserRole,
}: { units: Unit[]; activeUnitId?: string | null; currentUserRole: string }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const res = await createUserAction(formData)
      if (res.success) {
        toast.success('Usuário criado com sucesso!')
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
        <Button size="sm" className="h-8 gap-1">
          <Plus className="h-4 w-4" /> Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription className="sr-only">
            Preencha os dados do novo usuário.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" name="name" required placeholder="João Silva" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username de Acesso</Label>
            <Input
              id="username"
              name="username"
              required
              placeholder="joaosilva"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha Inicial</Label>
            <Input
              id="password"
              name="password"
              required
              type="password"
              minLength={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Cargo</Label>
            <select
              id="role"
              name="role"
              required
              className="h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="EMPLOYEE">Funcionário</option>
              <option value="MANAGER">Gerente</option>
              <option value="FINANCIAL">Financeiro</option>
              <option value="SELLER">Vendedor / Caixa</option>
              <option value="COLLECTOR">Coletador</option>
              <option value="FISCAL">Fiscal (Gerencia Coletas)</option>
              <option value="INVENTORY">Estoque</option>
              {currentUserRole === 'ADMIN' && (
                <option value="ADMIN">Administrador</option>
              )}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitId">Unidade (Opcional para Admin/Fiscal)</Label>
            <select
              id="unitId"
              name="unitId"
              defaultValue={activeUnitId || ''}
              className="h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">Acesso Global (Central)</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
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
