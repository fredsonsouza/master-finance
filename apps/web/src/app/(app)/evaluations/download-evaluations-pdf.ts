import type { EvaluationItem, EvaluationMetrics } from '@/http/get-evaluations'

interface DownloadEvaluationsPdfParams {
  evaluations: EvaluationItem[]
  metrics: EvaluationMetrics
  unitName?: string
  sellerName?: string
  period?: string
}

export async function downloadEvaluationsPdf({
  evaluations,
  metrics,
  unitName = 'Todas as Unidades',
  sellerName = 'Todos os Atendentes',
  period = 'Todo o Histórico',
}: DownloadEvaluationsPdfParams) {
  // Dynamic imports to keep initial bundle lean and avoid SSR issues
  const [{ pdf }, { EvaluationsPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./evaluations-pdf-document'),
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

  const doc = EvaluationsPdfDocument({
    evaluations,
    metrics,
    unitName,
    sellerName,
    period,
    logoUrl,
    issuedAt,
  })

  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)

  const dateSlug = now.toISOString().split('T')[0]
  const filename = `relatorio-avaliacoes-${dateSlug}.pdf`

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
