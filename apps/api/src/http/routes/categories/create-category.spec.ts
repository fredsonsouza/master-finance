import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { createCategory } from './create-category'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

describe('Create Category Unit Test', () => {
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

    await app.register(createCategory)
  })

  test('should allow INVENTORY role to create a category', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'INVENTORY',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.category.findFirst).mockResolvedValueOnce(null)

    const date = new Date('2026-08-21')
    vi.mocked(prisma.category.create).mockResolvedValueOnce({
      id: '523e4567-e89b-12d3-a456-426614174005',
      name: 'Medicamentos',
      createdAt: date,
      updatedAt: date,
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/categories',
      payload: {
        name: 'Medicamentos',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      categoryId: '523e4567-e89b-12d3-a456-426614174005',
      category: {
        id: '523e4567-e89b-12d3-a456-426614174005',
        name: 'Medicamentos',
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      },
    })
  })

  test('should block EMPLOYEE role from creating a category', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/categories',
      payload: {
        name: 'Medicamentos',
      },
    })

    expect(response.statusCode).toBe(401)
  })
})
