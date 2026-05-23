import { test, expect, describe, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { getProfile } from './get-profile'
import { prisma } from '@/lib/prisma'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'

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
    
    app.decorateRequest('jwtVerify', vi.fn().mockResolvedValue({ sub: 'user-id-123' }))
    
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
