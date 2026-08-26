import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getTopItems } from './get-top-items'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
    item: {
      findMany: vi.fn(),
    },
  },
}))

describe('Get Top Items Metrics Unit Test', () => {
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

    await app.register(getTopItems)
  })

  test('should return top items for a MANAGER', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([
      {
        itemId: '323e4567-e89b-12d3-a456-426614174001',
        value: 100,
        quantity: 5,
        item: { name: 'Item Alpha' },
      },
      {
        itemId: '323e4567-e89b-12d3-a456-426614174002',
        value: 200,
        quantity: 1,
        item: { name: 'Item Beta' },
      },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/metrics/top-items?month=2026-05&type=EXIT',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      items: [
        {
          itemId: '323e4567-e89b-12d3-a456-426614174001',
          itemName: 'Item Alpha',
          totalValue: 500,
        },
        {
          itemId: '323e4567-e89b-12d3-a456-426614174002',
          itemName: 'Item Beta',
          totalValue: 200,
        },
      ],
    })
  })

  test('should block EMPLOYEE from viewing top items', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/metrics/top-items?month=2026-05&type=EXIT',
    })

    expect(response.statusCode).toBe(401)
  })
})
