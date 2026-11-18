import { BadRequestError } from '@/http/routes/_errors/bad-request-error'

export const MAX_EMPLOYEE_PHOTO_BYTES = 600 * 1024 // 600 KB binary
export const MAX_EMPLOYEE_PHOTO_STRING_LENGTH = 850_000 // ~600 KB in Base64 + header

const DATA_URI_REGEX =
  /^data:image\/(jpeg|jpg|png);base64,([A-Za-z0-9+/=\r\n]+)$/i

const PNG_MAGIC_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_MAGIC_BYTES = [0xff, 0xd8, 0xff]

function hasMagicBytes(buffer: Buffer, signature: number[]): boolean {
  if (buffer.byteLength < signature.length) return false
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false
  }
  return true
}

/**
 * Valida, verifica a assinatura binária (Magic Bytes) e normaliza a foto 3x4 do colaborador.
 * Aceita:
 * - undefined (não altera)
 * - null ou string vazia (remove a foto -> null)
 * - URL http(s) válida (até 2048 caracteres)
 * - Data URI Base64 (image/jpeg ou image/png, até 600 KB decodificados, com verificação de Magic Bytes)
 */
export function validateAndNormalizeEmployeePhoto(
  photoUrl: string | null | undefined
): string | null | undefined {
  if (photoUrl === undefined) return undefined

  if (photoUrl === null) return null

  const trimmed = photoUrl.trim()
  if (trimmed.length === 0) return null

  if (trimmed.length > MAX_EMPLOYEE_PHOTO_STRING_LENGTH) {
    throw new BadRequestError(
      'A foto 3x4 excede o tamanho máximo permitido de 600KB.'
    )
  }

  // Caso 1: URL externa http(s)://
  if (/^https?:\/\//i.test(trimmed)) {
    if (trimmed.length > 2048) {
      throw new BadRequestError(
        'A URL da foto excede o limite de 2048 caracteres.'
      )
    }
    try {
      const parsed = new URL(trimmed)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Invalid protocol')
      }
      return trimmed
    } catch {
      throw new BadRequestError('A URL informada para a foto 3x4 é inválida.')
    }
  }

  // Caso 2: Data URI Base64 (JPEG / PNG)
  const match = DATA_URI_REGEX.exec(trimmed)
  if (!match) {
    throw new BadRequestError(
      'Formato de foto inválido. Utilize apenas imagens JPEG ou PNG em Base64 ou URL válida.'
    )
  }

  const rawFormat = match[1].toLowerCase()
  const cleanBase64 = match[2].replace(/[\r\n\s]+/g, '')

  if (cleanBase64.length === 0 || cleanBase64.length % 4 !== 0) {
    throw new BadRequestError('Codificação Base64 da foto 3x4 está malformada.')
  }

  const buffer = Buffer.from(cleanBase64, 'base64')

  if (buffer.byteLength < 16) {
    throw new BadRequestError(
      'O arquivo de imagem enviado está vazio ou incompleto.'
    )
  }

  if (buffer.byteLength > MAX_EMPLOYEE_PHOTO_BYTES) {
    throw new BadRequestError(
      'A foto 3x4 excede o tamanho máximo permitido de 600KB.'
    )
  }

  const isJpeg = rawFormat === 'jpeg' || rawFormat === 'jpg'
  const isPng = rawFormat === 'png'

  if (isJpeg && !hasMagicBytes(buffer, JPEG_MAGIC_BYTES)) {
    throw new BadRequestError(
      'O conteúdo binário não corresponde a uma imagem JPEG válida.'
    )
  }

  if (isPng && !hasMagicBytes(buffer, PNG_MAGIC_BYTES)) {
    throw new BadRequestError(
      'O conteúdo binário não corresponde a uma imagem PNG válida.'
    )
  }

  const normalizedMime = isJpeg ? 'jpeg' : 'png'
  return `data:image/${normalizedMime};base64,${cleanBase64}`
}
