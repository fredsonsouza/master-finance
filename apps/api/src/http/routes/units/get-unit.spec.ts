import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getUnit } from './get-unit'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    unit: {
      findUnique: vi.fn(),
    },
  },
}))

describe('Get Unit Unit Test', () => {
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
      if (error instanceof ResourceNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(getUnit)
  })

  test('should allow ADMIN to view a specific unit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
    } as any)

    const date = new Date('2026-05-23')

    vi.mocked(prisma.unit.findUnique).mockResolvedValueOnce({
      id: '223e4567-e89b-12d3-a456-426614174001',
      name: 'Central Unit',
      createdAt: date,
      updatedAt: date,
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/units/223e4567-e89b-12d3-a456-426614174001',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      unit: {
        id: '223e4567-e89b-12d3-a456-426614174001',
        name: 'Central Unit',
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      },
    })
  })

  test('should return 404 if unit does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    vi.mocked(prisma.unit.findUnique).mockResolvedValueOnce(null)

    const response = await app.inject({
      method: 'GET',
      url: '/units/223e4567-e89b-12d3-a456-426614174001',
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: 'Unit not found.' })
  })
})
