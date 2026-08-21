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
import type { User } from '@/http/get-users'
import { KeyRound } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { resetUserPasswordAction } from './actions'

interface ResetPasswordDialogProps {
  user: User | null
  onClose: () => void
}

export function ResetPasswordDialog({ user, onClose }: ResetPasswordDialogProps) {
  const open = user !== null
  const [isPending, startTransition] = useTransition()
  const [resetMode, setResetMode] = useState<'default' | 'custom'>('default')
  const [customPassword, setCustomPassword] = useState('')

  if (!user) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (resetMode === 'custom' && customPassword.trim().length < 4) {
      toast.error('A nova senha deve ter pelo menos 4 caracteres.')
      return
    }

    startTransition(async () => {
      const result = await resetUserPasswordAction(
        user!.id,
        resetMode === 'custom' ? customPassword.trim() : undefined
      )

      if (result.success) {
        toast.success(
          resetMode === 'custom'
            ? `Senha de ${user!.name} atualizada com sucesso!`
            : `Senha de ${user!.name} redefinida para a padrão (123)!`
        )
        onClose()
        setCustomPassword('')
        setResetMode('default')
      } else {
        toast.error(result.message || 'Erro ao redefinir senha.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <KeyRound className="h-5 w-5" />
            <DialogTitle>Redefinir Senha do Usuário</DialogTitle>
          </div>
          <DialogDescription>
            Defina uma nova senha de acesso para{' '}
            <strong className="text-on-surface">{user.name}</strong> (@
            {user.username}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-lg border border-outline/30 p-3 hover:bg-surface-container-lowest cursor-pointer transition-colors">
              <input
                type="radio"
                name="resetMode"
                value="default"
                checked={resetMode === 'default'}
                onChange={() => setResetMode('default')}
                className="mt-1 accent-primary"
              />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-on-surface">
                  Senha Padrão Provisória (123)
                </p>
                <p className="text-xs text-on-surface-variant">
                  A senha será redefinida para <strong>123</strong> e o usuário será obrigado a criar uma nova senha no próximo login.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-lg border border-outline/30 p-3 hover:bg-surface-container-lowest cursor-pointer transition-colors">
              <input
                type="radio"
                name="resetMode"
                value="custom"
                checked={resetMode === 'custom'}
                onChange={() => setResetMode('custom')}
                className="mt-1 accent-primary"
              />
              <div className="space-y-0.5 w-full">
                <p className="text-sm font-medium text-on-surface">
                  Definir Nova Senha Manualmente
                </p>
                <p className="text-xs text-on-surface-variant">
                  Você define a senha agora e o usuário poderá fazer login imediatamente com ela.
                </p>
              </div>
            </label>
          </div>

          {resetMode === 'custom' && (
            <div className="space-y-2 rounded-lg bg-surface-container p-3 border border-outline/20">
              <Label htmlFor="custom-password" className="text-xs font-semibold text-on-surface">
                Nova Senha de Acesso *
              </Label>
              <Input
                id="custom-password"
                type="password"
                placeholder="Mínimo 4 caracteres"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="bg-surface"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 cursor-pointer"
            >
              <KeyRound className="h-4 w-4" />
              {isPending ? 'Redefinindo...' : 'Confirmar Redefinição'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
