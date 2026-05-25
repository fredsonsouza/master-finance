import { test, expect, describe, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { deleteTransaction } from './delete-transaction'
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
      delete: vi.fn(),
    },
  },
}))

describe('Delete Transaction Unit Test', () => {
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

    await app.register(deleteTransaction)
  })

  test('should successfully delete a transaction within Employee unit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.transaction.findUnique).mockResolvedValueOnce({
      id: '423e4567-e89b-12d3-a456-426614174003',
      unitId: '223e4567-e89b-12d3-a456-426614174001', // Employee's unit
    } as any)

    vi.mocked(prisma.transaction.delete).mockResolvedValue({} as any)

    const response = await app.inject({
      method: 'DELETE',
      url: '/transactions/423e4567-e89b-12d3-a456-426614174003',
    })

    expect(response.statusCode).toBe(204)
    expect(prisma.transaction.delete).toHaveBeenCalledWith({
      where: { id: '423e4567-e89b-12d3-a456-426614174003' },
    })
  })
})
