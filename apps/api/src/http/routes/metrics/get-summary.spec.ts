import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getSummary } from './get-summary'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
  },
}))

describe('Get Summary Metrics Unit Test', () => {
  let app: ReturnType<typeof fastify>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    app.decorateRequest(
      'jwtVerify',
      vi.fn().mockResolvedValue({ sub: '123e4567-e89b-12d3-a456-426614174000' })
    )

    app.setErrorHandler((error: any, _request: any, reply: any) => {
      if (error instanceof UnauthorizedError) {
        return reply.status(401).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(getSummary)
  })

  test('should return financial summary for MANAGER', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    vi.mocked(prisma.transaction.findMany)
      .mockResolvedValueOnce([
        // current month (2 entries of 100, 1 exit of 50)
        { type: 'ENTRY', value: 100 },
        { type: 'ENTRY', value: 100 },
        { type: 'EXIT', value: 50 },
      ] as any)
      .mockResolvedValueOnce([
        // previous month (1 entry of 100, 1 exit of 100)
        { type: 'ENTRY', value: 100 },
        { type: 'EXIT', value: 100 },
      ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/metrics/summary?month=2026-05',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      totalEntries: 200,
      totalExits: 50,
      balance: 150,
      entriesVariation: 100, // (200 - 100) / 100 * 100
      exitsVariation: -50, // (50 - 100) / 100 * 100
      balanceVariation: 100, // previous balance was 0, so fallback logic handles it: current > 0 ? 100
    })
  })

  test('should block EMPLOYEE from accessing metrics', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/metrics/summary?month=2026-05',
    })

    expect(response.statusCode).toBe(401)
  })
})
