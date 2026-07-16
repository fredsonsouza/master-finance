import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequestError } from '../_errors/bad-request-error'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { authenticateWithPassword } from './authenticate-with-password'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
}))

describe('Authenticate with Password Unit Test', () => {
  let app: ReturnType<typeof fastify>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    app.decorateReply('jwtSign', vi.fn().mockResolvedValue('mocked-jwt-token'))

    app.setErrorHandler((error: any, _request: any, reply: any) => {
      if (error instanceof BadRequestError) {
        return reply.status(400).send({ message: error.message })
      }
      if (error instanceof ResourceNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(authenticateWithPassword)
  })

  test('should authenticate successfully with valid credentials', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '1',
      username: 'jhon',
      password_hash: 'hashed_pass',
    } as any)
    vi.mocked(compare).mockImplementation(async () => true)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: {
        username: 'jhon',
        password: 'password123',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({ token: 'mocked-jwt-token' })
  })

  test('should return 400 with invalid username', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: {
        username: 'invalid',
        password: 'password123',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message: 'Invalid credentials' })
  })

  test('should return 404 if user does not have a username', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '1',
      username: null,
      password_hash: 'hashed_pass',
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: {
        username: 'jhon',
        password: 'password123',
      },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      message: 'User does not have a username',
    })
  })

  test('should return 400 if user does not have a password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '1',
      username: 'jhon',
      password_hash: null,
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: {
        username: 'jhon',
        password: 'password123',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      message: 'User does not have a password, use social login',
    })
  })

  test('should return 400 with invalid password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '1',
      username: 'jhon',
      password_hash: 'hashed_pass',
    } as any)
    vi.mocked(compare).mockImplementation(async () => false)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: {
        username: 'jhon',
        password: 'wrong_password',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message: 'Invalid credentials' })
  })
})
