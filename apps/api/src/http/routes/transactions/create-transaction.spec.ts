import { test, expect, describe, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { createTransaction } from './create-transaction'
import { prisma } from '@/lib/prisma'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    unit: {
      findUnique: vi.fn(),
    },
    item: {
      findUnique: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
  },
}))

describe('Create Transaction Unit Test', () => {
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
      if (error instanceof BadRequestError || error.statusCode === 400) {
        return reply.status(400).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(createTransaction)
  })

  test('should allow EMPLOYEE to create a transaction in their unit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.unit.findUnique).mockResolvedValueOnce({
      id: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.item.findUnique).mockResolvedValueOnce({
      id: '323e4567-e89b-12d3-a456-426614174002',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.transaction.create).mockResolvedValue({
      id: '423e4567-e89b-12d3-a456-426614174003',
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/transactions',
      payload: {
        type: 'ENTRY',
        date: new Date('2026-05-25T12:00:00Z').toISOString(),
        value: 100.5,
        quantity: 10,
        itemId: '323e4567-e89b-12d3-a456-426614174002',
        unitId: '223e4567-e89b-12d3-a456-426614174001',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({ transactionId: '423e4567-e89b-12d3-a456-426614174003' })
    expect(prisma.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ month: '2026-05' })
    }))
  })

  test('should block EMPLOYEE from creating a transaction outside their unit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/transactions',
      payload: {
        type: 'ENTRY',
        date: new Date().toISOString(),
        value: 100,
        quantity: 1,
        itemId: '323e4567-e89b-12d3-a456-426614174002',
        unitId: '999e4567-e89b-12d3-a456-426614174000', // Mismatch!
      },
    })

    expect(response.statusCode).toBe(401)
    expect(prisma.transaction.create).not.toHaveBeenCalled()
  })
})
