import type { Employee } from '@/http/employees'

export async function downloadEmployeeRegistrationPdf(employee: Employee) {
  const [{ pdf }, { EmployeeRegistrationPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./employee-registration-pdf-document'),
  ])

  const doc = EmployeeRegistrationPdfDocument({ employee })
  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)

  const slug = employee.registrationNumber
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
  const filename = `ficha-registro-${slug}.pdf`

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
