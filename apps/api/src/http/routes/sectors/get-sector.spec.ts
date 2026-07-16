import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getSector } from './get-sector'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    sector: {
      findUnique: vi.fn(),
    },
  },
}))

describe('Get Sector Unit Test', () => {
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

    await app.register(getSector)
  })

  test('should allow EMPLOYEE to view sector', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const date = new Date('2026-05-23')

    vi.mocked(prisma.sector.findUnique).mockResolvedValueOnce({
      id: '323e4567-e89b-12d3-a456-426614174002',
      name: 'Reception',
      createdAt: date,
      updatedAt: date,
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/sectors/323e4567-e89b-12d3-a456-426614174002',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      sector: {
        id: '323e4567-e89b-12d3-a456-426614174002',
        name: 'Reception',
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      },
    })
  })
})
