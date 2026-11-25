export const MAX_SUBMISSION_PDF_BYTES = 5 * 1024 * 1024 // 5 MB

const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d] // %PDF-

export interface PreparedSubmissionPdf {
  fileName: string
  mimeType: 'application/pdf'
  sizeBytes: number
  fileData: string // Data URI base64
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Valida localmente um arquivo PDF (extensão, MIME, limite de 5 MB e cabeçalho %PDF-)
 * e converte para Data URI Base64 para envio seguro ao servidor.
 */
export async function prepareSubmissionPdfFile(
  file: File
): Promise<PreparedSubmissionPdf> {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error(
      'Formato não suportado. Envie exclusivamente arquivos em formato PDF (.pdf).'
    )
  }

  if (file.type && file.type.toLowerCase() !== 'application/pdf') {
    throw new Error(
      'Tipo de arquivo inválido. Selecione um documento PDF válido.'
    )
  }

  if (file.size < 64) {
    throw new Error('O arquivo PDF selecionado está vazio ou corrompido.')
  }

  if (file.size > MAX_SUBMISSION_PDF_BYTES) {
    throw new Error(
      'O arquivo PDF excede o limite máximo de 5 MB. Reduza o tamanho e tente novamente.'
    )
  }

  const headerSlice = new Uint8Array(await file.slice(0, 5).arrayBuffer())
  const hasMagic = PDF_MAGIC_BYTES.every(
    (byte, idx) => headerSlice[idx] === byte
  )
  if (!hasMagic) {
    throw new Error(
      'O conteúdo do arquivo não corresponde a um documento PDF válido.'
    )
  }

  const fileData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Falha ao ler o arquivo PDF.'))
      }
    }
    reader.onerror = () =>
      reject(new Error('Não foi possível ler o arquivo PDF selecionado.'))
    reader.readAsDataURL(file)
  })

  return {
    fileName: file.name,
    mimeType: 'application/pdf',
    sizeBytes: file.size,
    fileData,
  }
}
