import { describe, expect, test } from 'vitest'
import {
  MAX_EMPLOYEE_SUBMISSION_PDF_BYTES,
  sanitizeSubmissionFileName,
  validateAndDecodeSubmissionPdf,
} from './employee-submission-file'

const VALID_PDF_BUFFER = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n%%EOF\n'.repeat(
    2
  )
)

describe('Employee Submission PDF Validator', () => {
  test('accepts a valid PDF via Data URI and returns metadata + SHA-256 hash', () => {
    const dataUri = `data:application/pdf;base64,${VALID_PDF_BUFFER.toString('base64')}`

    const result = validateAndDecodeSubmissionPdf({
      fileName: 'Atestado Médico - João.pdf',
      mimeType: 'application/pdf',
      fileData: dataUri,
    })

    expect(result.fileName).toBe('Atestado_Medico_-_Joao.pdf')
    expect(result.mimeType).toBe('application/pdf')
    expect(result.sizeBytes).toBe(VALID_PDF_BUFFER.byteLength)
    expect(result.sha256Hash).toMatch(/^[a-f0-9]{64}$/)
    expect(result.content.equals(VALID_PDF_BUFFER)).toBe(true)
  })

  test('accepts a valid PDF via raw base64 string', () => {
    const result = validateAndDecodeSubmissionPdf({
      fileName: 'comprovante.pdf',
      fileData: VALID_PDF_BUFFER.toString('base64'),
    })

    expect(result.fileName).toBe('comprovante.pdf')
    expect(result.sizeBytes).toBe(VALID_PDF_BUFFER.byteLength)
  })

  test('rejects non-PDF extensions and non-PDF MIME types', () => {
    const base64 = VALID_PDF_BUFFER.toString('base64')

    expect(() =>
      validateAndDecodeSubmissionPdf({
        fileName: 'atestado.jpg',
        mimeType: 'application/pdf',
        fileData: base64,
      })
    ).toThrow(/PDF/)

    expect(() =>
      validateAndDecodeSubmissionPdf({
        fileName: 'atestado.pdf',
        mimeType: 'image/jpeg',
        fileData: base64,
      })
    ).toThrow(/MIME/)

    expect(() =>
      validateAndDecodeSubmissionPdf({
        fileName: 'atestado.pdf',
        fileData: `data:image/png;base64,${base64}`,
      })
    ).toThrow(/PDF/)
  })

  test('rejects spoofed binary payload disguised as .pdf (missing %PDF- magic bytes)', () => {
    const fakePdf = Buffer.from(
      'This is NOT a real PDF file, just plain text disguised as PDF!'.repeat(3)
    )

    expect(() =>
      validateAndDecodeSubmissionPdf({
        fileName: 'fake-atestado.pdf',
        mimeType: 'application/pdf',
        fileData: `data:application/pdf;base64,${fakePdf.toString('base64')}`,
      })
    ).toThrow(/conteúdo binário/)
  })

  test('rejects PDFs larger than 5 MB', () => {
    const oversized = Buffer.alloc(
      MAX_EMPLOYEE_SUBMISSION_PDF_BYTES + 128,
      0x20
    )
    oversized.write('%PDF-1.7\n', 0, 'ascii')

    expect(() =>
      validateAndDecodeSubmissionPdf({
        fileName: 'grande.pdf',
        mimeType: 'application/pdf',
        fileData: oversized.toString('base64'),
      })
    ).toThrow(/5 MB/)
  })

  test('sanitizes path traversal and special characters in filenames', () => {
    expect(sanitizeSubmissionFileName('../../etc/passwd.pdf')).toBe(
      'passwd.pdf'
    )
    expect(sanitizeSubmissionFileName('Declaração (2026)!.pdf')).toBe(
      'Declaracao_2026_.pdf'
    )
  })
})
