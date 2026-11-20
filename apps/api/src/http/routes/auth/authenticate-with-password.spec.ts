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
    employee: {
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

  test('should authenticate using employee registrationNumber (MASTER-XXXX)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      id: 'emp-1',
      registrationNumber: 'MASTER-JSS0001',
      status: 'ACTIVE',
      user: {
        id: 'user-1',
        username: 'joao.silva',
        password_hash: 'hashed_pass',
      },
    } as any)
    vi.mocked(compare).mockImplementation(async () => true)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: {
        username: 'master-jss0001',
        password: 'password123',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({ token: 'mocked-jwt-token' })
  })

  test('should block login when linked employee is INACTIVE', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      username: 'joao.silva',
      password_hash: 'hashed_pass',
      employee: {
        status: 'INACTIVE',
      },
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: {
        username: 'joao.silva',
        password: 'password123',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      message: 'Colaborador inativo. Entre em contato com o setor de RH.',
    })
  })

  test('should authenticate using formatted CPF (000.000.000-00)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.employee.findUnique)
      .mockResolvedValueOnce(null) // registrationNumber lookup
      .mockResolvedValueOnce({
        id: 'emp-2',
        cpf: '12345678901',
        status: 'ACTIVE',
        user: {
          id: 'user-2',
          username: 'MASTER-MC0002',
          password_hash: 'hashed_pass',
        },
      } as any)
    vi.mocked(compare).mockImplementation(async () => true)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: {
        username: '123.456.789-01',
        password: 'password123',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({ token: 'mocked-jwt-token' })
  })

  test('should block login using CPF when linked employee is INACTIVE', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.employee.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'emp-3',
        cpf: '98765432100',
        status: 'INACTIVE',
        user: {
          id: 'user-3',
          username: 'MASTER-XX0003',
          password_hash: 'hashed_pass',
        },
      } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: {
        username: '98765432100',
        password: 'password123',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      message: 'Colaborador inativo. Entre em contato com o setor de RH.',
    })
  })
})
