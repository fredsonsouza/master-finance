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
import { Check, CheckCircle2, Copy, KeyRound, ShieldAlert, Sparkles } from 'lucide-react'
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
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (!user) return null

  function handleClose() {
    onClose()
    setCustomPassword('')
    setResetMode('default')
    setGeneratedPassword(null)
    setCopied(false)
  }

  function handleCopy() {
    if (!generatedPassword) return
    navigator.clipboard.writeText(generatedPassword)
    setCopied(true)
    toast.success('Senha copiada para a área de transferência!')
    setTimeout(() => setCopied(false), 2500)
  }

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

      if (result.success && result.temporaryPassword) {
        setGeneratedPassword(result.temporaryPassword)
        toast.success(`Senha de ${user!.name} redefinida com sucesso!`)
      } else {
        toast.error(result.message || 'Erro ao redefinir senha.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-md">
        {generatedPassword ? (
          /* Tela de Sucesso com a Senha Gerada */
          <div className="space-y-5 py-2">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <DialogTitle className="text-xl font-bold text-on-surface">
                Senha Redefinida com Sucesso!
              </DialogTitle>
              <DialogDescription className="text-sm text-on-surface-variant">
                A nova senha provisória de <strong className="text-on-surface">{user.name}</strong> foi gerada.
              </DialogDescription>
            </div>

            {/* Box com a Senha */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center space-y-3">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Senha Provisória de Acesso
              </span>
              <div className="flex items-center justify-center gap-2">
                <code className="text-2xl font-mono font-bold tracking-wider text-primary select-all bg-surface px-4 py-2 rounded-lg border border-outline/20 shadow-sm">
                  {generatedPassword}
                </code>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="w-full gap-2 border-primary/40 text-primary hover:bg-primary hover:text-white cursor-pointer font-medium"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar Senha</span>
                  </>
                )}
              </Button>
            </div>

            {/* Aviso de Troca Obrigatória */}
            <div className="rounded-lg bg-surface-container p-3 border border-outline/20 flex items-start gap-2.5 text-xs text-on-surface-variant">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Repasse esta senha ao colaborador. Ao realizar o primeiro login, o sistema exigirá obrigatoriamente a criação de uma nova senha pessoal.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={handleClose}
                className="w-full cursor-pointer"
              >
                Concluir
              </Button>
            </div>
          </div>
        ) : (
          /* Formulário de Escolha de Redefinição */
          <>
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
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-on-surface">
                        Gerar Senha Provisória Única
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        <Sparkles className="h-3 w-3" /> Recomendado
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      O sistema gera uma senha provisória segura que você poderá copiar. O colaborador será obrigado a alterá-la no primeiro acesso.
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
                      Definir Senha Manualmente
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Você define uma senha específica agora e o colaborador poderá fazer login imediatamente.
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
                  onClick={handleClose}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
