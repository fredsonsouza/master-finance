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
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useState } from 'react'
import { toast } from 'sonner'
import { signOutAction } from '@/app/auth/sign-out-action'
import { updateProfileAction } from './profile-actions'

interface ProfileButtonProps {
  user: {
    id: string
    name: string | null
    username: string | null
    role: string
    unit?: { id: string; name: string } | null
  }
}

const roleNames: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  EMPLOYEE: 'Funcionário',
  FINANCIAL: 'Financeiro',
  SELLER: 'Caixa',
  COLLECTOR: 'Coletador',
  FISCAL: 'Fiscal',
  INVENTORY: 'Estoque',
}

export function ProfileButton({ user }: ProfileButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      const res = await updateProfileAction(formData)
      if (res.success) {
        toast.success('Perfil atualizado com sucesso!')
        setOpen(false)
        router.refresh()
      } else if (res.message) {
        toast.error(res.message)
      }
      return res
    },
    { success: false, message: null }
  )

  async function handleSignOut() {
    await signOutAction()
  }

  return (
    <div className="flex items-center gap-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div className="flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-80">
            <div className="hidden text-right sm:block">
              <p className="text-on-surface text-sm font-medium">
                {user.name || user.username}
              </p>
              <p className="text-on-surface-variant text-xs">
                {roleNames[user.role] || user.role}
              </p>
            </div>
            <div className="bg-primary-container text-on-primary-container flex h-10 w-10 items-center justify-center rounded-full font-bold shadow-sm">
              {(user.name || user.username || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Meu Perfil</DialogTitle>
            <DialogDescription>
              Visualize e atualize suas informações pessoais.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={user.name || ''}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  disabled
                  value={user.username || ''}
                  className="bg-surface-container opacity-70"
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  disabled
                  value={roleNames[user.role] || user.role}
                  className="bg-surface-container opacity-70"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Unidade Vinculada</Label>
              <Input
                disabled
                value={user.unit ? user.unit.name : 'Acesso Global (Matriz)'}
                className="bg-surface-container opacity-70"
              />
            </div>

            <div className="border-surface-container flex items-center justify-between border-t pt-4">
              <Button
                type="button"
                variant="outline"
                className="text-error border-error/50 hover:bg-error/10 cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
              <div className="flex gap-2">
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
                  {isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
