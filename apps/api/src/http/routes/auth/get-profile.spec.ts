import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { getProfile } from './get-profile'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

describe('Get Profile Unit Test', () => {
  let app: ReturnType<typeof fastify>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    app.decorateRequest(
      'jwtVerify',
      vi.fn().mockResolvedValue({ sub: 'user-id-123' })
    )

    app.setErrorHandler((error: any, _request: any, reply: any) => {
      if (error instanceof ResourceNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(getProfile)
  })

  test('should return user profile successfully', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000000',
      name: 'John Doe',
      username: 'jhon',
      avatarUrl: 'http://example.com/avatar.png',
      forcePasswordChange: false,
      role: 'ADMIN',
      unitId: null,
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/profile',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      user: {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'John Doe',
        username: 'jhon',
        avatarUrl: 'http://example.com/avatar.png',
        forcePasswordChange: false,
        role: 'ADMIN',
        unitId: null,
      },
    })
  })

  test('should return 404 if user is not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const response = await app.inject({
      method: 'GET',
      url: '/profile',
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: 'User not found' })
  })
})
