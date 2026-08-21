'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, ShieldAlert } from 'lucide-react'
import { useActionState } from 'react'
import { changePasswordAction } from './actions'

interface ChangePasswordFormProps {
  userName: string | null
  username: string | null
}

export function ChangePasswordForm({ userName, username }: ChangePasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      const result = await changePasswordAction(formData)
      if (result && !result.success) {
        return result
      }
      return { success: true, message: null }
    },
    { success: false, message: null }
  )

  return (
    <div className="bg-background flex min-h-screen min-w-80 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-primary text-4xl font-bold tracking-tight">
            Master Admin
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            Sistema Integrado de Gestão Médica e Financeira
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <KeyRound className="h-6 w-6" />
              <CardTitle>Crie sua Nova Senha</CardTitle>
            </div>
            <CardDescription>
              Olá <strong>{userName || username}</strong>! Você está utilizando uma senha provisória definida pelo Administrador. Por segurança, crie sua nova senha pessoal para prosseguir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Mínimo de 4 caracteres"
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirme a Nova Senha *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                />
              </div>

              {state.message && (
                <div className="bg-error-container text-on-error-container flex items-center gap-2 rounded-md p-3 text-sm">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{state.message}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full gap-2 cursor-pointer"
                disabled={isPending}
              >
                <KeyRound className="h-4 w-4" />
                {isPending ? 'Salvando...' : 'Salvar Nova Senha e Continuar'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-surface-container flex justify-center border-t pt-4">
            <p className="text-on-surface-variant text-xs text-center">
              Após salvar sua nova senha, você terá acesso imediato às funcionalidades do sistema.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
