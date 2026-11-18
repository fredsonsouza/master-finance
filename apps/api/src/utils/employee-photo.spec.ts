import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { describe, expect, test } from 'vitest'
import { validateAndNormalizeEmployeePhoto } from './employee-photo'

function buildValidJpegDataUrl(extraBytes = 32): string {
  const bytes = Buffer.alloc(3 + extraBytes, 0xaa)
  bytes[0] = 0xff
  bytes[1] = 0xd8
  bytes[2] = 0xff
  return `data:image/jpeg;base64,${bytes.toString('base64')}`
}

function buildValidPngDataUrl(extraBytes = 32): string {
  const magic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  const bytes = Buffer.alloc(magic.length + extraBytes, 0xbb)
  magic.forEach((b, i) => {
    bytes[i] = b
  })
  return `data:image/png;base64,${bytes.toString('base64')}`
}

describe('Employee 3x4 Photo Validator & Normalizer', () => {
  test('should return undefined when photoUrl is undefined and null when null or empty', () => {
    expect(validateAndNormalizeEmployeePhoto(undefined)).toBeUndefined()
    expect(validateAndNormalizeEmployeePhoto(null)).toBeNull()
    expect(validateAndNormalizeEmployeePhoto('   ')).toBeNull()
  })

  test('should accept valid JPEG Data URI with authentic Magic Bytes (FF D8 FF)', () => {
    const validJpeg = buildValidJpegDataUrl()
    const result = validateAndNormalizeEmployeePhoto(validJpeg)
    expect(result).toBe(validJpeg)
  })

  test('should normalize data:image/jpg;base64 to data:image/jpeg;base64', () => {
    const validJpg = buildValidJpegDataUrl().replace(
      'data:image/jpeg;',
      'data:image/jpg;'
    )
    const result = validateAndNormalizeEmployeePhoto(validJpg)
    expect(result?.startsWith('data:image/jpeg;base64,')).toBe(true)
  })

  test('should accept valid PNG Data URI with authentic Magic Bytes', () => {
    const validPng = buildValidPngDataUrl()
    const result = validateAndNormalizeEmployeePhoto(validPng)
    expect(result).toBe(validPng)
  })

  test('should accept valid HTTPS URL', () => {
    const url = 'https://cdn.masterclin.com.br/photos/master-jss0001.jpg'
    expect(validateAndNormalizeEmployeePhoto(url)).toBe(url)
  })

  test('should reject spoofed file whose binary Magic Bytes do not match JPEG', () => {
    const fakeBytes = Buffer.from(
      '<script>alert("xss")</script>1234567890',
      'utf-8'
    )
    const spoofedDataUrl = `data:image/jpeg;base64,${fakeBytes.toString('base64')}`

    expect(() => validateAndNormalizeEmployeePhoto(spoofedDataUrl)).toThrow(
      BadRequestError
    )
  })

  test('should reject unsupported or dangerous MIME types such as SVG', () => {
    const svgPayload = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      'utf-8'
    ).toString('base64')
    const svgDataUrl = `data:image/svg+xml;base64,${svgPayload}`

    expect(() => validateAndNormalizeEmployeePhoto(svgDataUrl)).toThrow(
      BadRequestError
    )
  })

  test('should reject photos exceeding the 600KB binary limit', () => {
    const oversizedJpeg = buildValidJpegDataUrl(620 * 1024)
    expect(() => validateAndNormalizeEmployeePhoto(oversizedJpeg)).toThrow(
      BadRequestError
    )
  })
})
