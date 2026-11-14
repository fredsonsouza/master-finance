import type { EmployeeRequestItem } from '@/http/employees'
import { pdf } from '@react-pdf/renderer'
import { QRCodeCanvas } from 'qrcode.react'
import { createRoot } from 'react-dom/client'
import { EmployeeDocumentPdfDocument } from './employee-document-pdf-document'

async function generateQrCodeDataUrl(value: string): Promise<string> {
  if (typeof window === 'undefined' || !value) return ''

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '-9999px'
  document.body.appendChild(container)

  const root = createRoot(container)

  try {
    root.render(
      <QRCodeCanvas value={value} size={220} level="M" marginSize={2} />
    )
    await new Promise((resolve) => setTimeout(resolve, 80))

    const canvas = container.querySelector('canvas')
    return canvas ? canvas.toDataURL('image/png') : ''
  } finally {
    root.unmount()
    container.remove()
  }
}

export async function downloadEmployeeDocumentPdf(
  request: EmployeeRequestItem
) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const logoUrl = origin ? `${origin}/images/masterclin-logo.png` : undefined
  const verificationUrl =
    origin && request.verificationCode
      ? `${origin}/verify/${request.verificationCode}`
      : ''

  const qrCodeDataUrl = verificationUrl
    ? await generateQrCodeDataUrl(verificationUrl)
    : ''

  const doc = (
    <EmployeeDocumentPdfDocument
      request={request}
      logoUrl={logoUrl}
      qrCodeDataUrl={qrCodeDataUrl}
      verificationUrl={verificationUrl}
    />
  )

  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url

  const safeCode = (
    request.verificationCode ||
    request.employee.registrationNumber ||
    request.id.slice(0, 8)
  )
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')

  const typePrefix =
    request.type === 'DECLARATION'
      ? 'declaracao'
      : request.type === 'WARNING'
        ? 'advertencia'
        : 'recibo'

  link.download = `${typePrefix}-${safeCode}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
