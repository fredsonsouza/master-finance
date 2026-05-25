import { test, expect, describe, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { createSector } from './create-sector'
import { prisma } from '@/lib/prisma'
import { UnauthorizedError } from '../_errors/unauthorized-error'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    unit: {
      findUnique: vi.fn(),
    },
    sector: {
      create: vi.fn(),
    },
  },
}))

describe('Create Sector Unit Test', () => {
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
      if (error.statusCode === 400) {
        return reply.status(400).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(createSector)
  })

  test('should allow MANAGER to create a sector', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    vi.mocked(prisma.unit.findUnique).mockResolvedValueOnce({
      id: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.sector.create).mockResolvedValue({
      id: '323e4567-e89b-12d3-a456-426614174002',
      name: 'Reception',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/sectors',
      payload: {
        name: 'Reception',
        unitId: '223e4567-e89b-12d3-a456-426614174001',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({ sectorId: '323e4567-e89b-12d3-a456-426614174002' })
  })

  test('should block EMPLOYEE from creating a sector', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/sectors',
      payload: {
        name: 'Reception',
        unitId: '223e4567-e89b-12d3-a456-426614174001',
      },
    })

    expect(response.statusCode).toBe(401)
    expect(prisma.sector.create).not.toHaveBeenCalled()
  })
})
