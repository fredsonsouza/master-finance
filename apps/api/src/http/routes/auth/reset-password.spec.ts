import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { resetPassword } from './reset-password'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('mocked_hash'),
}))

describe('Reset Password Unit Test', () => {
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
      if (
        error instanceof UnauthorizedError ||
        error.name === 'UnauthorizedError' ||
        error.statusCode === 401
      ) {
        return reply.status(401).send({ message: error.message })
      }
      if (
        error instanceof BadRequestError ||
        error.name === 'BadRequestError' ||
        error.statusCode === 400
      ) {
        return reply.status(400).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message, stack: error.stack })
    })

    await app.register(resetPassword)
  })

  test('should allow ADMIN to reset an employee password to default (123)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '223e4567-e89b-12d3-a456-426614174001',
      name: 'John Doe',
      username: 'johndoe',
    } as any)

    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/223e4567-e89b-12d3-a456-426614174001/reset-password',
    })

    expect(response.statusCode).toBe(204)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '223e4567-e89b-12d3-a456-426614174001' },
      data: {
        password_hash: 'mocked_hash',
        forcePasswordChange: true,
      },
    })
  })

  test('should allow ADMIN to reset user password with custom password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '223e4567-e89b-12d3-a456-426614174001',
      name: 'John Doe',
      username: 'johndoe',
    } as any)

    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/223e4567-e89b-12d3-a456-426614174001/reset-password',
      payload: {
        password: 'newSecretPassword123',
      },
    })

    expect(response.statusCode).toBe(204)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '223e4567-e89b-12d3-a456-426614174001' },
      data: {
        password_hash: 'mocked_hash',
        forcePasswordChange: false,
      },
    })
  })

  test('should return 401 if MANAGER tries to reset password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/223e4567-e89b-12d3-a456-426614174001/reset-password',
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      message:
        'Apenas administradores podem alterar ou redefinir a senha de outros usuários.',
    })
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  test('should return 401 if EMPLOYEE tries to reset password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
    } as any)

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/223e4567-e89b-12d3-a456-426614174001/reset-password',
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      message:
        'Apenas administradores podem alterar ou redefinir a senha de outros usuários.',
    })
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  test('should return 400 if target user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/223e4567-e89b-12d3-a456-426614174001/reset-password',
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message: 'Usuário não encontrado.' })
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})
