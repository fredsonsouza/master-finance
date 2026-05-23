import { test, expect, describe, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { resetPassword } from './reset-password'
import { prisma } from '@/lib/prisma'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
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
    
    app.decorateRequest('jwtVerify', vi.fn().mockResolvedValue({ sub: 'admin-id' }))
    
    app.setErrorHandler((error: any, _request: any, reply: any) => {
      if (error instanceof UnauthorizedError) {
        return reply.status(401).send({ message: error.message })
      }
      if (error instanceof BadRequestError) {
        return reply.status(400).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(resetPassword)
  })

  test('should allow MANAGER to reset an employee password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'admin-id',
      role: 'MANAGER',
    } as any)
    
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '00000000-0000-0000-0000-000000000000',
    } as any)

    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/00000000-0000-0000-0000-000000000000/reset-password',
    })

    expect(response.statusCode).toBe(204)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '00000000-0000-0000-0000-000000000000' },
      data: {
        password_hash: 'mocked_hash',
        forcePasswordChange: true,
      },
    })
  })

  test('should return 401 if EMPLOYEE tries to reset password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'emp-id',
      role: 'EMPLOYEE',
    } as any)

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/00000000-0000-0000-0000-000000000000/reset-password',
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: 'You are not allowed to reset passwords.' })
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  test('should return 400 if target user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'admin-id',
      role: 'ADMIN',
    } as any)
    
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/00000000-0000-0000-0000-000000000000/reset-password',
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message: 'User not found.' })
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})
