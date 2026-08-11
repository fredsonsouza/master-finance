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
    },
    evaluation: {
      findMany: vi.fn(),
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

  test('should allow SELLER to view their own evaluations', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'SELLER',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const date = new Date('2026-08-10')

    vi.mocked(prisma.evaluation.findMany).mockResolvedValueOnce([
      {
        id: '323e4567-e89b-12d3-a456-426614174002',
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
  })
})
