'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex  min-height: 400px flex-col items-center justify-center space-y-4 text-center">
      <div className="bg-error-container rounded-full p-4">
        <AlertCircle className="text-error h-8 w-8" />
      </div>
      <div>
        <h3 className="text-on-surface text-lg font-semibold">
          Algo deu errado
        </h3>
        <p className="text-on-surface-variant mt-1 text-sm">
          Não foi possível carregar os itens. Tente novamente.
        </p>
      </div>
      <Button onClick={() => reset()} variant="outline" className="mt-2">
        Tentar novamente
      </Button>
    </div>
  )
}
