'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled root error:', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-md rounded-2xl border border-outline/30 bg-surface-container-lowest p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-error">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-on-surface">
            Ocorreu um erro inesperado
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Não foi possível carregar a aplicação. Por favor, tente novamente.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/')}
              className="cursor-pointer"
            >
              Ir para o Início
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
