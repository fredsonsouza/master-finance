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
import type { User } from '@/http/get-users'
import { KeyRound } from 'lucide-react'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { updateUserAction } from './actions'

interface UpdateUserDialogProps {
  user: User | null
  units: Unit[]
  activeUnitId: string | null
  currentUserRole: string
  onClose: () => void
}

export function UpdateUserDialog({
  user,
  units,
  activeUnitId,
  currentUserRole,
  onClose,
}: UpdateUserDialogProps) {
  const open = user !== null

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      if (!user) return prevState
      const result = await updateUserAction(user.id, formData)
      if (result.success) {
        toast.success('Usuário atualizado com sucesso!')
        onClose()
      } else if (result.message) {
        toast.error(result.message)
      }
      return result
    },
    { success: false, message: null }
  )

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Altere as informações, cargo, unidade ou senha do usuário.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="update-user-name">Nome Completo</Label>
            <Input
              id="update-user-name"
              name="name"
              required
              defaultValue={user.name}
            />
          </div>
          <div className="space-y-2">
            <Label>Nome de Usuário</Label>
            <Input
              disabled
              value={user.username}
              className="bg-surface-container opacity-70"
            />
            <p className="text-xs text-on-surface-variant">
              O nome de usuário não pode ser alterado.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="update-user-role">Cargo</Label>
              <select
                id="update-user-role"
                name="role"
                required
                defaultValue={user.role}
                className="h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
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
              <Label htmlFor="update-user-unit">Unidade Base</Label>
              <select
                id="update-user-unit"
                name="unitId"
                defaultValue={user.unitId || ''}
                className="h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
              >
                <option value="">Acesso Global (Sem Unidade)</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentUserRole === 'ADMIN' && (
            <div className="space-y-2 border-t border-outline/20 pt-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <Label htmlFor="update-user-password" className="font-medium text-sm">
                  Alterar Senha do Usuário (Opcional)
                </Label>
              </div>
              <Input
                id="update-user-password"
                name="password"
                type="password"
                placeholder="Digite para definir nova senha (mínimo 4 caracteres)"
                autoComplete="new-password"
              />
              <p className="text-xs text-on-surface-variant">
                Deixe este campo em branco para manter a senha atual do usuário.
              </p>
            </div>
          )}

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
              {isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
