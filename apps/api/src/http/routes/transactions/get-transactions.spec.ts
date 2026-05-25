import { test, expect, describe, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { getTransactions } from './get-transactions'
import { prisma } from '@/lib/prisma'
import { UnauthorizedError } from '../_errors/unauthorized-error'

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

describe('Get Transactions Unit Test', () => {
  let app: ReturnType<typeof fastify>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)
    
    app.decorateRequest('jwtVerify', vi.fn().mockResolvedValue({ sub: '123e4567-e89b-12d3-a456-426614174000' }))
    
    app.setErrorHandler((error: any, _request: any, reply: any) => {
      if (error instanceof UnauthorizedError) {
        return reply.status(401).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(getTransactions)
  })

  test('should fetch transactions using EMPLOYEE unitId automatically', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([])

    const response = await app.inject({
      method: 'GET',
      url: '/transactions',
    })

    expect(response.statusCode).toBe(200)
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { unitId: '223e4567-e89b-12d3-a456-426614174001' },
    }))
  })

  test('MANAGER can fetch transactions across units by month', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([])

    const response = await app.inject({
      method: 'GET',
      url: '/transactions?month=2026-05',
    })

    expect(response.statusCode).toBe(200)
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ month: '2026-05' }),
    }))
  })
})
