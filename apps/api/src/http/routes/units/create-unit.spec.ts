import { test, expect, describe, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { createUnit } from './create-unit'
import { prisma } from '@/lib/prisma'
import { UnauthorizedError } from '../_errors/unauthorized-error'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    unit: {
      create: vi.fn(),
    },
  },
}))

describe('Create Unit Unit Test', () => {
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

    await app.register(createUnit)
  })

  test('should allow MANAGER to create a unit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    vi.mocked(prisma.unit.create).mockResolvedValue({
      id: '223e4567-e89b-12d3-a456-426614174001',
      name: 'Central Clinic',
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/units',
      payload: {
        name: 'Central Clinic',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({ unitId: '223e4567-e89b-12d3-a456-426614174001' })
    expect(prisma.unit.create).toHaveBeenCalledWith({
      data: { name: 'Central Clinic' },
    })
  })

  test('should block EMPLOYEE from creating a unit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/units',
      payload: {
        name: 'Central Clinic',
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: 'You are not allowed to create a unit.' })
    expect(prisma.unit.create).not.toHaveBeenCalled()
  })

  test('should throw validation error if name is missing or empty', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/units',
      payload: {
        name: '', // validation: min(1)
      },
    })

    expect(response.statusCode).toBe(400) // Fastify default Zod validation
    expect(prisma.unit.create).not.toHaveBeenCalled()
  })
})
