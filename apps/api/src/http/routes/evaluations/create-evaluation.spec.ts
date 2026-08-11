import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequestError } from '../_errors/bad-request-error'
import { createEvaluation } from './create-evaluation'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    evaluation: {
      create: vi.fn(),
    },
  },
}))

describe('Create Evaluation Unit Test', () => {
  let app: ReturnType<typeof fastify>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    app.setErrorHandler((error: any, _request: any, reply: any) => {
      if (error instanceof BadRequestError || error.statusCode === 400) {
        return reply.status(400).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(createEvaluation)
  })

  test('should allow public customer to submit evaluation for a seller', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Maria Recepção',
      role: 'SELLER',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.evaluation.create).mockResolvedValueOnce({
      id: '323e4567-e89b-12d3-a456-426614174002',
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/evaluations/public',
      payload: {
        sellerId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 'EXCELLENT',
        presetComment: 'Excelente! O atendente foi muito educado.',
        observation: 'Tudo perfeito.',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      evaluationId: '323e4567-e89b-12d3-a456-426614174002',
    })
  })
})
