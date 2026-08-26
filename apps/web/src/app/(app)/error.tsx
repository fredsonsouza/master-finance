'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App area error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-container text-error shadow-sm">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-on-surface">
        Erro ao carregar os dados
      </h2>
      <p className="mt-2 max-w-md text-sm text-on-surface-variant">
        Não conseguimos carregar as informações desta seção. Verifique sua conexão ou tente recarregar os dados.
      </p>

      {process.env.NODE_ENV !== 'production' && error.message && (
        <pre className="mt-4 max-w-lg overflow-x-auto rounded-lg bg-surface-container p-3 text-left font-mono text-xs text-error">
          {error.message}
        </pre>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => reset()}
          className="flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
        <Button variant="outline" asChild className="cursor-pointer">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o Início
          </Link>
        </Button>
      </div>
    </div>
  )
}
