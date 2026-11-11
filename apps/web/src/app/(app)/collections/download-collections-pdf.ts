import type { Collection } from '@/http/collections'
import type { CollectionsPdfFilters } from './collections-pdf-document'

interface DownloadCollectionsPdfParams {
  collections: Collection[]
  filters: CollectionsPdfFilters
}

export async function downloadCollectionsPdf({
  collections,
  filters,
}: DownloadCollectionsPdfParams) {
  // Dynamic imports to prevent SSR hydration issues and keep the initial Next.js bundle lean
  const [{ pdf }, { CollectionsPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./collections-pdf-document'),
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

  const doc = CollectionsPdfDocument({
    collections,
    filters,
    logoUrl,
    issuedAt,
  })

  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)

  const dateSlug = now.toISOString().split('T')[0]
  const filename = `relatorio-recoletas-${dateSlug}.pdf`

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
