import type { CashClosure } from '@/http/cash-closures'
import type { CashClosuresPdfFilters } from './cash-closures-pdf-document'

interface DownloadCashClosuresPdfParams {
  closures: CashClosure[]
  totalValue: number
  filters: CashClosuresPdfFilters
}

export async function downloadCashClosuresPdf({
  closures,
  totalValue,
  filters,
}: DownloadCashClosuresPdfParams) {
  // Dynamic imports to prevent SSR hydration issues and keep the initial Next.js bundle lean
  const [{ pdf }, { CashClosuresPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./cash-closures-pdf-document'),
  ])

  const logoUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/images/masterclin-logo.png`
      : undefined

  const now = new Date()
  const issuedAt = now.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

  const doc = CashClosuresPdfDocument({
    closures,
    totalValue,
    filters,
    logoUrl,
    issuedAt,
  })

  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)

  const dateSlug = now.toISOString().split('T')[0]
  const filename = `relatorio-fechamentos-${dateSlug}.pdf`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up object URL after a short timeout
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}
