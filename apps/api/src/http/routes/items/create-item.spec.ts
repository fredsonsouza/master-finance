import { test, expect, describe, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { createItem } from './create-item'
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
    sector: {
      findUnique: vi.fn(),
    },
    item: {
      create: vi.fn(),
    },
  },
}))

describe('Create Item Unit Test', () => {
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

    await app.register(createItem)
  })

  test('should allow EMPLOYEE to create an item in their own unit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.unit.findUnique).mockResolvedValueOnce({
      id: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.item.create).mockResolvedValue({
      id: '423e4567-e89b-12d3-a456-426614174003',
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/items',
      payload: {
        name: 'Desk',
        unitId: '223e4567-e89b-12d3-a456-426614174001',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({ itemId: '423e4567-e89b-12d3-a456-426614174003' })
  })

  test('should block EMPLOYEE from creating an item in another unit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/items',
      payload: {
        name: 'Desk',
        unitId: '323e4567-e89b-12d3-a456-426614174002', // Different unit
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: 'You are not allowed to create an item in this unit.' })
    expect(prisma.item.create).not.toHaveBeenCalled()
  })

  test('should return 400 if sector does not belong to unit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    vi.mocked(prisma.unit.findUnique).mockResolvedValueOnce({
      id: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.sector.findUnique).mockResolvedValueOnce({
      id: '323e4567-e89b-12d3-a456-426614174002',
      unitId: '888e4567-e89b-12d3-a456-426614174000', // Mismatch!
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/items',
      payload: {
        name: 'Desk',
        unitId: '223e4567-e89b-12d3-a456-426614174001',
        sectorId: '323e4567-e89b-12d3-a456-426614174002',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message: 'Sector does not belong to the specified unit.' })
    expect(prisma.item.create).not.toHaveBeenCalled()
  })
})
