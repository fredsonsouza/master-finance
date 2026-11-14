import { createHash, randomBytes } from 'node:crypto'

const IGNORED_CONNECTORS = new Set(['DE', 'DA', 'DO', 'DAS', 'DOS', 'E'])

/**
 * Extracts uppercase initials from a full name, ignoring common Portuguese connectors.
 * Example: "João da Silva Santos" -> "JSS"
 */
export function extractInitials(fullName: string): string {
  const normalized = fullName
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .trim()

  const parts = normalized
    .split(/\s+/)
    .filter((word) => word.length > 0 && !IGNORED_CONNECTORS.has(word))

  if (parts.length === 0) {
    return 'COL'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 3).padEnd(2, 'X')
  }

  return parts
    .slice(0, 4)
    .map((word) => word[0])
    .join('')
}

/**
 * Formats an employee registration number in the standard MASTER-JSS0001 mask.
 */
export function formatRegistrationNumber(
  fullName: string,
  sequenceNumber: number
): string {
  const initials = extractInitials(fullName)
  const paddedSeq = String(Math.max(1, sequenceNumber)).padStart(4, '0')
  return `MASTER-${initials}${paddedSeq}`
}

/**
 * Generates electronic signature metadata (verificationCode + SHA-256 contentHash).
 */
export function generateElectronicSignature(params: {
  employeeId: string
  type: string
  subtype: string
  title: string
  description: string
  issuedById: string
  signedAt: Date
}) {
  const datePart = params.signedAt.toISOString().slice(0, 10).replace(/-/g, '')
  const randomSuffix = randomBytes(3).toString('hex').toUpperCase()
  const verificationCode = `MC-DOC-${datePart}-${randomSuffix}`

  const canonicalString = [
    params.employeeId,
    params.type,
    params.subtype,
    params.title,
    params.description,
    params.issuedById,
    params.signedAt.toISOString(),
    verificationCode,
  ].join('|')

  const contentHash = createHash('sha256').update(canonicalString).digest('hex')

  return {
    verificationCode,
    contentHash,
  }
}

/**
 * Masks a CPF for LGPD-compliant public document verification.
 * Example: "123.456.789-00" or "12345678900" -> "***.456.789-**"
 */
export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) {
    return '***.***.***-**'
  }
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`
}
