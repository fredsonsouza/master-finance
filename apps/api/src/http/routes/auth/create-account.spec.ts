import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequestError } from '../_errors/bad-request-error'
import { createAccount } from './create-account'

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
  }
})

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('mocked_hash'),
}))

describe('Create Account Unit Test', () => {
  let app: ReturnType<typeof fastify>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    app.setErrorHandler((error: any, _request: any, reply: any) => {
      if (error instanceof BadRequestError) {
        return reply.status(400).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(createAccount)
  })

  test('should return 400 if username is already taken', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1' } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: {
        name: 'John Doe',
        username: 'jhon',
        password: 'password123',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message: 'Username already taken!' })
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  test('should return 201 when account is created successfully', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({ id: '1' } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: {
        name: 'John Doe',
        username: 'new_user',
        password: 'password123',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'John Doe',
        username: 'new_user',
        password_hash: 'mocked_hash',
      },
    })
  })
})
