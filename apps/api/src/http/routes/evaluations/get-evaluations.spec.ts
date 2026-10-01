import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getEvaluations } from './get-evaluations'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    evaluation: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}))

describe('Get Evaluations Unit Test', () => {
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

    await app.register(getEvaluations)
  })

  test('should allow MANAGER/ADMIN to view evaluations', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const date = new Date('2026-08-10')

    vi.mocked(prisma.evaluation.count).mockResolvedValueOnce(1)

    vi.mocked(prisma.evaluation.findMany).mockResolvedValueOnce([
      {
        id: '323e4567-e89b-12d3-a456-426614174002',
        clientName: 'João da Silva',
        rating: 'EXCELLENT',
        presetComment: 'Excelente!',
        observation: 'Ótimo',
        createdAt: date,
        sellerId: '123e4567-e89b-12d3-a456-426614174000',
        seller: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Maria Recepção',
          avatarUrl: null,
        },
        unit: {
          id: '223e4567-e89b-12d3-a456-426614174001',
          name: 'Unidade Centro',
        },
      },
    ] as any)

    vi.mocked(prisma.evaluation.groupBy).mockResolvedValueOnce([
      { rating: 'EXCELLENT', _count: { rating: 1 } },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/evaluations',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().metrics).toEqual({
      total: 1,
      excellentCount: 1,
      goodCount: 0,
      regularCount: 0,
      badCount: 0,
      satisfactionRate: 100,
    })
    expect(response.json().pagination).toEqual({
      page: 1,
      perPage: 10,
      totalCount: 1,
      totalPages: 1,
    })
  })

  test('should block SELLER from viewing evaluations', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'SELLER',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/evaluations',
    })

    expect(response.statusCode).toBe(401)
  })

  test('should skip podium calculation when includePodium is false', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.evaluation.count).mockResolvedValueOnce(0)
    vi.mocked(prisma.evaluation.findMany).mockResolvedValueOnce([])
    vi.mocked(prisma.evaluation.groupBy).mockResolvedValueOnce([])

    const response = await app.inject({
      method: 'GET',
      url: '/evaluations?includePodium=false&podiumUnitId=223e4567-e89b-12d3-a456-426614174001',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().podium).toEqual([])
    // prisma.evaluation.groupBy should only be called once (for metrics distribution), not twice (no podium)
    expect(prisma.evaluation.groupBy).toHaveBeenCalledTimes(1)
  })

  test('should compute podium when includePodium is true and podiumUnitId is provided', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.evaluation.count).mockResolvedValueOnce(1)
    vi.mocked(prisma.evaluation.findMany).mockResolvedValueOnce([])
    // First groupBy for metrics, second groupBy for podium
    vi.mocked(prisma.evaluation.groupBy)
      .mockResolvedValueOnce([
        { rating: 'EXCELLENT', _count: { rating: 1 } },
      ] as any)
      .mockResolvedValueOnce([
        {
          sellerId: '123e4567-e89b-12d3-a456-426614174000',
          rating: 'EXCELLENT',
          _count: { rating: 1 },
        },
      ] as any)

    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Maria Vendedora',
        avatarUrl: null,
        unit: {
          id: '223e4567-e89b-12d3-a456-426614174001',
          name: 'Unidade Centro',
        },
      },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/evaluations?includePodium=true&podiumUnitId=223e4567-e89b-12d3-a456-426614174001',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().podium).toHaveLength(1)
    expect(response.json().podium[0].sellerName).toBe('Maria Vendedora')
    expect(response.json().podium[0].satisfactionRate).toBe(100)
    expect(prisma.evaluation.groupBy).toHaveBeenCalledTimes(2)
  })
})
