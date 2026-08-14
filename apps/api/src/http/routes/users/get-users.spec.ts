import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getUsers } from './get-users'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('Get Users Unit Test', () => {
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
      console.error('SERVER ERROR:', error)
      return reply.status(500).send({ message: error.message })
    })

    await app.register(getUsers)
  })

  test('should allow MANAGER to view users with pagination', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    vi.mocked(prisma.user.count).mockResolvedValueOnce(2)
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        name: 'John',
        username: 'john',
        role: 'EMPLOYEE',
        unitId: '423e4567-e89b-12d3-a456-426614174003',
        avatarUrl: null,
      },
      {
        id: '323e4567-e89b-12d3-a456-426614174002',
        name: 'Jane',
        username: 'jane',
        role: 'ADMIN',
        unitId: null,
        avatarUrl: null,
      },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/users',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      users: [
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          name: 'John',
          username: 'john',
          role: 'EMPLOYEE',
          unitId: '423e4567-e89b-12d3-a456-426614174003',
          avatarUrl: null,
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174002',
          name: 'Jane',
          username: 'jane',
          role: 'ADMIN',
          unitId: null,
          avatarUrl: null,
        },
      ],
      pagination: {
        page: 1,
        perPage: 20,
        totalCount: 2,
        totalPages: 1,
      },
    })
  })

  test('should block EMPLOYEE from viewing users', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/users',
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      message: 'You are not allowed to view users.',
    })
    expect(prisma.user.findMany).not.toHaveBeenCalled()
  })
})
