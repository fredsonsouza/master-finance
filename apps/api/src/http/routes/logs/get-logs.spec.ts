import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getLogs } from './get-logs'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
  },
}))

describe('Get Audit Logs Route', () => {
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
      if (error.statusCode === 400) {
        return reply.status(400).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(getLogs)
  })

  test('should allow ADMIN to retrieve audit logs', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
    } as any)

    const mockLogs = [
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        action: 'CREATE',
        resource: 'UNIT',
        resourceId: '323e4567-e89b-12d3-a456-426614174002',
        details: 'Criou a unidade Central',
        createdAt: new Date(),
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Admin User',
          username: 'admin',
          role: 'ADMIN',
        },
      },
    ]

    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as any)

    const response = await app.inject({
      method: 'GET',
      url: '/logs',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.logs).toHaveLength(1)
    expect(body.logs[0].details).toBe('Criou a unidade Central')
    expect(prisma.auditLog.findMany).toHaveBeenCalled()
  })

  test('should block non-ADMIN users (e.g. MANAGER)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/logs',
    })

    expect(response.statusCode).toBe(401)
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled()
  })
})
