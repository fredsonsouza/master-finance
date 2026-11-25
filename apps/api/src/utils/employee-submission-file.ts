import { createHash } from 'node:crypto'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'

export const MAX_EMPLOYEE_SUBMISSION_PDF_BYTES = 5 * 1024 * 1024 // 5 MB binary
export const MAX_EMPLOYEE_SUBMISSION_BASE64_LENGTH = 7_100_000 // ~5 MB in Base64 + Data URI header

const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d] // %PDF-
const PDF_DATA_URI_PREFIX = /^data:application\/pdf(?:;[^,]*)?;base64,/i
const BASE64_PATTERN = /^[A-Za-z0-9+/=]+$/

export interface ValidatedSubmissionPdf {
  fileName: string
  mimeType: 'application/pdf'
  sizeBytes: number
  sha256Hash: string
  content: Buffer
}

function hasPdfMagicBytes(buffer: Buffer): boolean {
  if (buffer.byteLength < PDF_MAGIC_BYTES.length) return false
  for (let i = 0; i < PDF_MAGIC_BYTES.length; i++) {
    if (buffer[i] !== PDF_MAGIC_BYTES[i]) return false
  }
  return true
}

export function sanitizeSubmissionFileName(rawName: string): string {
  const baseName = rawName.replace(/\\/g, '/').split('/').pop()?.trim()

  const cleaned = (baseName || 'documento.pdf')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^A-Za-z0-9._-\s]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120)

  if (!cleaned || cleaned === '.pdf') {
    return 'documento.pdf'
  }

  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned}.pdf`
}

/**
 * Valida, verifica a assinatura binária (Magic Bytes %PDF-) e normaliza um documento PDF
 * enviado por colaboradores (atestados médicos, declarações de comparecimento e outros documentos).
 * Aceita apenas PDF real (até 5 MB decodificados).
 */
export function validateAndDecodeSubmissionPdf(input: {
  fileName: string
  mimeType?: string | null
  fileData: string
}): ValidatedSubmissionPdf {
  const rawFileName = input.fileName?.trim() || ''
  if (rawFileName.length === 0) {
    throw new BadRequestError('Informe o nome do arquivo PDF.')
  }

  if (!rawFileName.toLowerCase().endsWith('.pdf')) {
    throw new BadRequestError(
      'Formato inválido. Apenas arquivos no formato PDF (.pdf) são aceitos.'
    )
  }

  if (
    input.mimeType &&
    input.mimeType.trim().toLowerCase() !== 'application/pdf'
  ) {
    throw new BadRequestError(
      'Tipo MIME inválido. Apenas arquivos application/pdf são aceitos.'
    )
  }

  const trimmedData = input.fileData?.trim() || ''
  if (trimmedData.length === 0) {
    throw new BadRequestError('O arquivo PDF enviado está vazio.')
  }

  if (trimmedData.length > MAX_EMPLOYEE_SUBMISSION_BASE64_LENGTH) {
    throw new BadRequestError(
      'O arquivo PDF excede o tamanho máximo permitido de 5 MB.'
    )
  }

  // Reject non-PDF Data URIs explicitly
  if (
    trimmedData.startsWith('data:') &&
    !PDF_DATA_URI_PREFIX.test(trimmedData)
  ) {
    throw new BadRequestError(
      'Formato de arquivo inválido. Apenas documentos PDF são permitidos.'
    )
  }

  const cleanBase64 = trimmedData
    .replace(PDF_DATA_URI_PREFIX, '')
    .replace(/[\r\n\s]+/g, '')

  if (
    cleanBase64.length === 0 ||
    cleanBase64.length % 4 !== 0 ||
    !BASE64_PATTERN.test(cleanBase64)
  ) {
    throw new BadRequestError(
      'A codificação Base64 do arquivo PDF está malformada.'
    )
  }

  const buffer = Buffer.from(cleanBase64, 'base64')

  if (buffer.byteLength < 64) {
    throw new BadRequestError('O arquivo PDF enviado está vazio ou corrompido.')
  }

  if (buffer.byteLength > MAX_EMPLOYEE_SUBMISSION_PDF_BYTES) {
    throw new BadRequestError(
      'O arquivo PDF excede o tamanho máximo permitido de 5 MB.'
    )
  }

  if (!hasPdfMagicBytes(buffer)) {
    throw new BadRequestError(
      'O conteúdo binário enviado não corresponde a um documento PDF válido.'
    )
  }

  const sha256Hash = createHash('sha256').update(buffer).digest('hex')

  return {
    fileName: sanitizeSubmissionFileName(rawFileName),
    mimeType: 'application/pdf',
    sizeBytes: buffer.byteLength,
    sha256Hash,
    content: buffer,
  }
}
