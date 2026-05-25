'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SignIn } from './actions'
import { useActionState } from 'react'

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      // Temporary proxy to the real server action so we can handle errors
      try {
        await SignIn(formData)
        return { success: true, message: null }
      } catch (err) {
        if (err instanceof Error) {
          return { success: false, message: err.message }
        }
        return { success: false, message: 'Erro ao realizar login.' }
      }
    },
    { success: false, message: null }
  )

  return (
    <div className="bg-background flex min-h-screen min-w-80 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-primary text-4xl font-bold tracking-tight">
            Master Finance
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            Sistema Integrado de Gestão Médica e Financeira
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acesso ao Sistema</CardTitle>
            <CardDescription>
              Insira suas credenciais para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="Seu nome de usuário"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <a
                    href="#"
                    className="text-primary hover:text-primary-container text-sm font-medium"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Sua senha"
                />
              </div>

              {state.message && (
                <div className="bg-error-container text-on-error-container rounded-md p-3 text-sm">
                  {state.message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Autenticando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-surface-container flex justify-center border-t pt-6">
            <p className="text-on-surface-variant text-sm">
              Precisa de ajuda?{' '}
              <a href="#" className="text-primary font-medium hover:underline">
                Contate o suporte
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
