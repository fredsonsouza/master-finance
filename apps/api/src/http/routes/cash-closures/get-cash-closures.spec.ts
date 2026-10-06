import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getCashClosures } from './get-cash-closures'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    cashClosure: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('Get Cash Closures Unit Test', () => {
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

    await app.register(getCashClosures)
  })

  test('should fetch cash closures with pagination metadata', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const date = new Date('2026-10-01T12:00:00Z')

    vi.mocked(prisma.cashClosure.count).mockResolvedValueOnce(35)
    vi.mocked(prisma.cashClosure.findMany).mockResolvedValueOnce([
      {
        id: '423e4567-e89b-12d3-a456-426614174002',
        cashDate: date,
        value: 1500,
        observation: 'Fechamento do dia',
        status: 'OPEN',
        createdAt: date,
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Admin User',
        },
        sector: {
          id: '323e4567-e89b-12d3-a456-426614174003',
          name: 'Recepção',
        },
        unit: { id: '223e4567-e89b-12d3-a456-426614174001', name: 'Unidade 1' },
      },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/cash-closures?page=2&perPage=20',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.closures).toHaveLength(1)
    expect(body.pagination).toEqual({
      page: 2,
      perPage: 20,
      totalCount: 35,
      totalPages: 2,
    })

    expect(prisma.cashClosure.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 20,
        skip: 20,
        orderBy: { cashDate: 'desc' },
      })
    )
  })

  test('should filter by SELLER unitId automatically', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'SELLER',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.cashClosure.count).mockResolvedValueOnce(0)
    vi.mocked(prisma.cashClosure.findMany).mockResolvedValueOnce([])

    const response = await app.inject({
      method: 'GET',
      url: '/cash-closures',
    })

    expect(response.statusCode).toBe(200)
    expect(prisma.cashClosure.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          unitId: '223e4567-e89b-12d3-a456-426614174001',
        }),
      })
    )
  })

  test('should filter by search term on user name', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'FINANCIAL',
    } as any)

    vi.mocked(prisma.cashClosure.count).mockResolvedValueOnce(1)
    vi.mocked(prisma.cashClosure.findMany).mockResolvedValueOnce([])

    const response = await app.inject({
      method: 'GET',
      url: '/cash-closures?search=Maria',
    })

    expect(response.statusCode).toBe(200)
    expect(prisma.cashClosure.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user: {
            name: {
              contains: 'Maria',
              mode: 'insensitive',
            },
          },
        }),
      })
    )
  })

  test('should accept perPage up to 500 for PDF export', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
    } as any)

    vi.mocked(prisma.cashClosure.count).mockResolvedValueOnce(0)
    vi.mocked(prisma.cashClosure.findMany).mockResolvedValueOnce([])

    const response = await app.inject({
      method: 'GET',
      url: '/cash-closures?page=1&perPage=500',
    })

    expect(response.statusCode).toBe(200)
    expect(prisma.cashClosure.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 500,
        skip: 0,
      })
    )
  })
})
