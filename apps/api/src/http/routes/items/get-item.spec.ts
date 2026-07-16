import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getItem } from './get-item'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    item: {
      findUnique: vi.fn(),
    },
  },
}))

describe('Get Item Unit Test', () => {
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

    await app.register(getItem)
  })

  test('should allow EMPLOYEE to view an item in their unit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const date = new Date('2026-05-25')

    vi.mocked(prisma.item.findUnique).mockResolvedValueOnce({
      id: '423e4567-e89b-12d3-a456-426614174003',
      name: 'Desk',
      description: null,
      sectorId: null,
      unitId: '223e4567-e89b-12d3-a456-426614174001', // Same unit
      createdAt: date,
      updatedAt: date,
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/items/423e4567-e89b-12d3-a456-426614174003',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      item: {
        id: '423e4567-e89b-12d3-a456-426614174003',
        name: 'Desk',
        description: null,
        sectorId: null,
        unitId: '223e4567-e89b-12d3-a456-426614174001',
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      },
    })
  })

  test('should block EMPLOYEE from viewing an item outside their unit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.item.findUnique).mockResolvedValueOnce({
      id: '423e4567-e89b-12d3-a456-426614174003',
      unitId: '999e4567-e89b-12d3-a456-426614174000', // Different unit
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/items/423e4567-e89b-12d3-a456-426614174003',
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      message: 'You are not allowed to view this item.',
    })
  })
})
