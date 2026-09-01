import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getTransactions } from './get-transactions'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
      count: vi.fn(),
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

    await app.register(getTransactions)
  })

  test('should fetch transactions using EMPLOYEE unitId automatically', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.transaction.count).mockResolvedValueOnce(0)
    vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([])

    const response = await app.inject({
      method: 'GET',
      url: '/transactions',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().pagination).toEqual({
      page: 1,
      perPage: 20,
      totalCount: 0,
      totalPages: 1,
    })
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { unitId: '223e4567-e89b-12d3-a456-426614174001' },
      })
    )
  })

  test('MANAGER can fetch transactions across units by month and search', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    vi.mocked(prisma.transaction.count).mockResolvedValueOnce(1)
    vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        type: 'ENTRY',
        date: new Date('2026-05-10'),
        value: 50,
        quantity: 10,
        month: '2026-05',
        batchId: null,
        item: {
          id: '223e4567-e89b-12d3-a456-426614174002',
          name: 'Luva Látex',
          description: 'Caixa 100un',
          sector: { name: 'Recepção' },
        },
        sector: { id: '323e4567-e89b-12d3-a456-426614174003', name: 'Recepção' },
        unit: { name: 'Matriz' },
      },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/transactions?month=2026-05&page=1&perPage=10',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().pagination).toEqual({
      page: 1,
      perPage: 10,
      totalCount: 1,
      totalPages: 1,
    })
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ month: '2026-05' }),
        take: 10,
        skip: 0,
      })
    )
  })
})
