'use client'

import { PermissionsSelector } from '@/components/permissions-selector'
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
import type { Permission, Role } from '@/lib/permissions'
import { KeyRound, ShieldAlert } from 'lucide-react'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { updateUserAction } from './actions'

interface UpdateUserDialogProps {
  user: User | null
  units: Unit[]
  activeUnitId: string | null
  currentUserRole: Role
  currentUserPermissions?: Permission[]
  onClose: () => void
  onUpdated?: () => void
}

export function UpdateUserDialog({
  user,
  units,
  currentUserRole,
  currentUserPermissions = [],
  onClose,
  onUpdated,
}: UpdateUserDialogProps) {
  const open = user !== null
  const isAdmin = currentUserRole === 'ADMIN'

  const [role, setRole] = useState<Role>(user?.role ?? 'EMPLOYEE')
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    user?.permissions ?? []
  )

  useEffect(() => {
    if (user) {
      setRole(user.role)
      setSelectedPermissions(user.permissions ?? [])
    }
  }, [user])

  const [, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      if (!user) return prevState
      formData.set('permissionsJson', JSON.stringify(selectedPermissions))
      const result = await updateUserAction(user.id, formData)
      if (result.success) {
        toast.success('Usuário atualizado com sucesso!')
        onUpdated?.()
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário e Permissões</DialogTitle>
          <DialogDescription>
            Ajuste os dados, unidade vinculada e checkboxes de permissão do
            colaborador.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label>Identificador / Matrícula</Label>
              <Input
                disabled
                value={user.employee?.registrationNumber || user.username}
                className="bg-surface-container opacity-70"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="update-user-role">Perfil Base</Label>
              <select
                id="update-user-role"
                name="role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm text-on-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
              >
                <option value="EMPLOYEE">
                  Colaborador (Permissões abaixo)
                </option>
                {isAdmin && (
                  <option value="ADMIN">Administrador (Acesso Total)</option>
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
                <option value="">Sem Unidade Fixa (Matriz/Global)</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {role === 'ADMIN' ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Perfil Administrador:</strong> possui acesso irrestrito
                a todos os módulos e unidades do sistema.
              </span>
            </div>
          ) : (
            <div className="border-t border-surface-container pt-4">
              <PermissionsSelector
                value={selectedPermissions}
                onChange={setSelectedPermissions}
                actorRole={currentUserRole}
                actorPermissions={currentUserPermissions}
              />
            </div>
          )}

          {isAdmin && (
            <div className="space-y-2 border-t border-outline/20 pt-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <Label
                  htmlFor="update-user-password"
                  className="font-semibold text-sm text-primary"
                >
                  Alterar Senha do Usuário (Opcional)
                </Label>
              </div>
              <Input
                id="update-user-password"
                name="password"
                type="password"
                placeholder="Digite para definir nova senha (mínimo 4 caracteres)"
                autoComplete="new-password"
                className="bg-surface"
              />
              <p className="text-xs text-on-surface-variant">
                Deixe este campo em branco para manter a senha atual do usuário.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
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
