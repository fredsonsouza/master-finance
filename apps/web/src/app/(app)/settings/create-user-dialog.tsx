'use client'

import { PermissionsSelector } from '@/components/permissions-selector'
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
import type { Permission, Role } from '@/lib/permissions'
import { Plus, ShieldAlert } from 'lucide-react'
import { useActionState, useState } from 'react'
import { toast } from 'sonner'
import { createUserAction } from './actions'

export function CreateUserDialog({
  units,
  activeUnitId,
  currentUserRole,
  currentUserPermissions = [],
  onCreated,
}: {
  units: Unit[]
  activeUnitId?: string | null
  currentUserRole: Role
  currentUserPermissions?: Permission[]
  onCreated?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<Role>('EMPLOYEE')
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    []
  )

  const [, formAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      formData.set('permissionsJson', JSON.stringify(selectedPermissions))
      const res = await createUserAction(formData)
      if (res.success) {
        toast.success('Usuário criado com sucesso!')
        setRole('EMPLOYEE')
        setSelectedPermissions([])
        setOpen(false)
        onCreated?.()
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
        <Button size="sm" className="h-8 gap-1 cursor-pointer">
          <Plus className="h-4 w-4" /> Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Usuário e Permissões</DialogTitle>
          <DialogDescription>
            Crie uma conta de acesso manual ou marque as permissões específicas
            por módulo.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" name="name" required placeholder="João Silva" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Usuário / Identificador</Label>
              <Input
                id="username"
                name="username"
                required
                placeholder="joaosilva ou MASTER-JS0001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="role">Perfil Base</Label>
              <select
                id="role"
                name="role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="EMPLOYEE">
                  Colaborador (Permissões abaixo)
                </option>
                {currentUserRole === 'ADMIN' && (
                  <option value="ADMIN">Administrador (Acesso Total)</option>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitId">Unidade Base</Label>
              <select
                id="unitId"
                name="unitId"
                defaultValue={activeUnitId || ''}
                className="h-10 w-full rounded-md border border-outline bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="">Sem Unidade Fixa (Matriz/Global)</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {role === 'ADMIN' ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Perfil Administrador:</strong> concede acesso irrestrito
                a todos os módulos, todas as unidades, logs de auditoria e
                gerenciamento de outros administradores.
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

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending ? 'Salvando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
