import { test, expect, describe, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { getSectors } from './get-sectors'
import { prisma } from '@/lib/prisma'
import { UnauthorizedError } from '../_errors/unauthorized-error'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    sector: {
      findMany: vi.fn(),
    },
  },
}))

describe('Get Sectors Unit Test', () => {
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
      return reply.status(500).send({ message: error.message })
    })

    await app.register(getSectors)
  })

  test('should allow MANAGER to view sectors', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    const date = new Date('2026-05-23')

    vi.mocked(prisma.sector.findMany).mockResolvedValueOnce([
      { id: '223e4567-e89b-12d3-a456-426614174001', name: 'Reception', unitId: '323e4567-e89b-12d3-a456-426614174002', createdAt: date, updatedAt: date },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/sectors',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      sectors: [
        { id: '223e4567-e89b-12d3-a456-426614174001', name: 'Reception', unitId: '323e4567-e89b-12d3-a456-426614174002', createdAt: date.toISOString(), updatedAt: date.toISOString() },
      ],
    })
  })

  test('should restrict EMPLOYEE to their own unit sectors', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '323e4567-e89b-12d3-a456-426614174002',
    } as any)

    vi.mocked(prisma.sector.findMany).mockResolvedValueOnce([])

    const response = await app.inject({
      method: 'GET',
      url: '/sectors', // Employee requests all sectors
    })

    expect(response.statusCode).toBe(200)
    
    // Check if prisma was called with the enforced unitId filter
    expect(prisma.sector.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { unitId: '323e4567-e89b-12d3-a456-426614174002' },
    }))
  })
})
