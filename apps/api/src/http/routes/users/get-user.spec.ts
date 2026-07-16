import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getUser } from './get-user'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

describe('Get User Unit Test', () => {
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

    await app.register(getUser)
  })

  test('should allow ADMIN to view a specific user', async () => {
    // Requester
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
    } as any)

    // Target user
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '223e4567-e89b-12d3-a456-426614174001',
      name: 'John',
      username: 'john',
      role: 'EMPLOYEE',
      unitId: '423e4567-e89b-12d3-a456-426614174003',
      avatarUrl: null,
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/users/223e4567-e89b-12d3-a456-426614174001',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      user: {
        id: '223e4567-e89b-12d3-a456-426614174001',
        name: 'John',
        username: 'john',
        role: 'EMPLOYEE',
        unitId: '423e4567-e89b-12d3-a456-426614174003',
        avatarUrl: null,
      },
    })
  })

  test('should return 404 if user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

    const response = await app.inject({
      method: 'GET',
      url: '/users/123e4567-e89b-12d3-a456-426614174000',
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: 'User not found.' })
  })
})
