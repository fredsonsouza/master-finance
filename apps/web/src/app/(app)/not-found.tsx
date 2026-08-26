import { Button } from '@/components/ui/button'
import { FileQuestion, Home } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-sm">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-on-surface">Página não encontrada</h2>
      <p className="mt-2 max-w-md text-sm text-on-surface-variant">
        O recurso ou página que você está procurando não existe ou foi movido.
      </p>
      <div className="mt-6">
        <Button asChild className="cursor-pointer">
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Voltar para o Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
