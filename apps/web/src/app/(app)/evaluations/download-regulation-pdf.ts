export async function downloadRegulationPdf() {
  // Dynamic imports to keep initial bundle lean and avoid SSR issues
  const [{ pdf }, { RegulationPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./regulation-pdf-document'),
  ])

  const logoUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/images/masterclin-logo.png`
      : undefined

  const doc = RegulationPdfDocument({
    logoUrl,
  })

  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)

  const filename = 'regulamento-avaliacao-atendimento.pdf'

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
