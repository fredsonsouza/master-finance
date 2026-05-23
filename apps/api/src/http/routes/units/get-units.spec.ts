import { test, expect, describe, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { getUnits } from './get-units'
import { prisma } from '@/lib/prisma'
import { UnauthorizedError } from '../_errors/unauthorized-error'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    unit: {
      findMany: vi.fn(),
    },
  },
}))

describe('Get Units Unit Test', () => {
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

    await app.register(getUnits)
  })

  test('should allow MANAGER to view all units', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    const date = new Date('2026-05-23')

    vi.mocked(prisma.unit.findMany).mockResolvedValueOnce([
      { id: '223e4567-e89b-12d3-a456-426614174001', name: 'Unit 1', createdAt: date, updatedAt: date },
      { id: '323e4567-e89b-12d3-a456-426614174002', name: 'Unit 2', createdAt: date, updatedAt: date },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/units',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      units: [
        { id: '223e4567-e89b-12d3-a456-426614174001', name: 'Unit 1', createdAt: date.toISOString(), updatedAt: date.toISOString() },
        { id: '323e4567-e89b-12d3-a456-426614174002', name: 'Unit 2', createdAt: date.toISOString(), updatedAt: date.toISOString() },
      ],
    })
  })

  test('should block EMPLOYEE from viewing units', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/units',
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: 'You are not allowed to view all units.' })
    expect(prisma.unit.findMany).not.toHaveBeenCalled()
  })
})
