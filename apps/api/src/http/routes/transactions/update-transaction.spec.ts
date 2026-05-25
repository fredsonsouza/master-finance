import { test, expect, describe, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { updateTransaction } from './update-transaction'
import { prisma } from '@/lib/prisma'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    transaction: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('Update Transaction Unit Test', () => {
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
      if (error instanceof BadRequestError) {
        return reply.status(400).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(updateTransaction)
  })

  test('should successfully update a transaction', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    const date = new Date('2026-05-25T12:00:00Z')

    vi.mocked(prisma.transaction.findUnique).mockResolvedValueOnce({
      id: '423e4567-e89b-12d3-a456-426614174003',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
      date: date,
      month: '2026-05',
    } as any)

    vi.mocked(prisma.transaction.update).mockResolvedValue({} as any)

    const response = await app.inject({
      method: 'PUT',
      url: '/transactions/423e4567-e89b-12d3-a456-426614174003',
      payload: {
        value: 150,
      },
    })

    expect(response.statusCode).toBe(204)
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: '423e4567-e89b-12d3-a456-426614174003' },
      data: expect.objectContaining({
        value: 150,
        month: '2026-05', // Ensures month remains correct
      }),
    })
  })
})
