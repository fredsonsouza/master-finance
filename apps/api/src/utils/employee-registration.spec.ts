import { describe, expect, test } from 'vitest'
import {
  extractInitials,
  formatRegistrationNumber,
  generateElectronicSignature,
  maskCpf,
} from './employee-registration'

describe('Employee Registration & Electronic Signature Utils', () => {
  test('should extract initials ignoring connectors and diacritics', () => {
    expect(extractInitials('João da Silva Santos')).toBe('JSS')
    expect(extractInitials('Maria de Fátima dos Anjos')).toBe('MFA')
    expect(extractInitials('Érica Oliveira')).toBe('EO')
    expect(extractInitials('Carlos')).toBe('CAR')
  })

  test('should format registration number using MASTER-XXXX mask', () => {
    expect(formatRegistrationNumber('João da Silva Santos', 1)).toBe(
      'MASTER-JSS0001'
    )
    expect(formatRegistrationNumber('Ana Beatriz Costa', 42)).toBe(
      'MASTER-ABC0042'
    )
  })

  test('should generate electronic signature with verificationCode and SHA-256 contentHash', () => {
    const signedAt = new Date('2026-11-14T12:00:00.000Z')
    const sig = generateElectronicSignature({
      employeeId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'DECLARATION',
      subtype: 'DECLARACAO_VINCULO',
      title: 'Declaração de Vínculo Empregatício',
      description: 'Declaro para os devidos fins...',
      issuedById: '223e4567-e89b-12d3-a456-426614174001',
      signedAt,
    })

    expect(sig.verificationCode).toMatch(/^MC-DOC-20261114-[0-9A-F]{6}$/)
    expect(sig.contentHash).toMatch(/^[0-9a-f]{64}$/)
  })

  test('should mask CPF for LGPD compliance', () => {
    expect(maskCpf('12345678901')).toBe('***.456.789-**')
    expect(maskCpf('123.456.789-01')).toBe('***.456.789-**')
    expect(maskCpf('invalid')).toBe('***.***.***-**')
  })
})
