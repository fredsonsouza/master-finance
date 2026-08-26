import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { createTransaction } from './create-transaction'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    unit: {
      findUnique: vi.fn(),
    },
    sector: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    item: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

describe('Create Transaction Unit Test', () => {
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
      name: 'Unidade Centro',
    } as any)

    vi.mocked(prisma.$transaction).mockImplementation(async (arg: any) => {
      if (typeof arg === 'function') {
        return arg({
          sector: {
            findFirst: vi.fn().mockResolvedValue({
              id: '523e4567-e89b-12d3-a456-426614174005',
              name: 'Estoque',
            }),
            create: vi.fn(),
            findUnique: vi.fn(),
          },
          item: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: '323e4567-e89b-12d3-a456-426614174002',
                name: 'Syringe',
              },
            ]),
            update: vi.fn(),
          },
          transaction: {
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn(),
          },
          auditLog: {
            create: vi.fn(),
          },
        })
      }
      return arg
    })

    const response = await app.inject({
      method: 'POST',
      url: '/transactions',
      payload: {
        type: 'ENTRY',
        date: new Date('2026-05-25T12:00:00Z').toISOString(),
        unitId: '223e4567-e89b-12d3-a456-426614174001',
        sectorId: '523e4567-e89b-12d3-a456-426614174005',
        items: [
          {
            itemId: '323e4567-e89b-12d3-a456-426614174002',
            quantity: 10,
            value: 100.5,
          },
        ],
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toHaveProperty('batchId')
    expect(prisma.$transaction).toHaveBeenCalled()
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
        date: new Date('2026-05-25T12:00:00Z').toISOString(),
        unitId: '823e4567-e89b-12d3-a456-426614174008', // Different unit
        sectorId: '523e4567-e89b-12d3-a456-426614174005',
        items: [
          {
            itemId: '323e4567-e89b-12d3-a456-426614174002',
            quantity: 10,
            value: 100.5,
          },
        ],
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      message: 'You are not allowed to create a transaction in this unit.',
    })
  })
})
