import type { PodiumItem } from '@/http/get-evaluations'

interface DownloadPodiumPdfParams {
  podium: PodiumItem[]
  unitName: string
  podiumMonth: string // YYYY-MM
}

export async function downloadPodiumPdf({
  podium,
  unitName,
  podiumMonth,
}: DownloadPodiumPdfParams) {
  // Dynamic imports to keep initial bundle lean and avoid SSR issues
  const [{ pdf }, { PodiumPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./podium-pdf-document'),
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

  const doc = PodiumPdfDocument({
    podium,
    unitName,
    podiumMonth,
    logoUrl,
    issuedAt,
  })

  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)

  const filename = `podio-recepcao-${podiumMonth || now.toISOString().slice(0, 7)}.pdf`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}
