import { prisma } from '@/lib/prisma'
import { checkEvaluationAvailability } from '@/utils/evaluation-schedule'
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

vi.mock('@/utils/evaluation-schedule', () => ({
  checkEvaluationAvailability: vi.fn(),
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

  test('should allow public customer to submit evaluation during open hours (e.g. 10:00 AM weekday)', async () => {
    vi.mocked(checkEvaluationAvailability).mockReturnValueOnce({
      isOpen: true,
    })

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
        clientName: 'João da Silva',
        rating: 'EXCELLENT',
        observation: 'Ótimo atendimento, muito rápido e atencioso.',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      evaluationId: '323e4567-e89b-12d3-a456-426614174002',
    })
  })

  test('should reject evaluation submitted outside allowed schedule (e.g. 18:25 PM)', async () => {
    vi.mocked(checkEvaluationAvailability).mockReturnValueOnce({
      isOpen: false,
      message: 'O período de avaliações de hoje encerrou às 18h20.',
    })

    const response = await app.inject({
      method: 'POST',
      url: '/evaluations/public',
      payload: {
        sellerId: '123e4567-e89b-12d3-a456-426614174000',
        clientName: 'João da Silva',
        rating: 'EXCELLENT',
        observation: 'Tentativa fora do horário.',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toContain('18h20')
    expect(prisma.evaluation.create).not.toHaveBeenCalled()
  })
})
