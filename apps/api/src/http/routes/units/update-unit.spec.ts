import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { updateUnit } from './update-unit'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    unit: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('Update Unit Unit Test', () => {
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
      if (error instanceof BadRequestError) {
        return reply.status(400).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(updateUnit)
  })

  test('should successfully update a unit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    vi.mocked(prisma.unit.findUnique).mockResolvedValueOnce({
      id: '223e4567-e89b-12d3-a456-426614174001',
      name: 'Old Unit Name',
    } as any)

    vi.mocked(prisma.unit.update).mockResolvedValue({} as any)

    const response = await app.inject({
      method: 'PUT',
      url: '/units/223e4567-e89b-12d3-a456-426614174001',
      payload: {
        name: 'New Unit Name',
      },
    })

    expect(response.statusCode).toBe(204)
    expect(prisma.unit.update).toHaveBeenCalledWith({
      where: { id: '223e4567-e89b-12d3-a456-426614174001' },
      data: { name: 'New Unit Name' },
    })
  })

  test('should return 400 if unit not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    vi.mocked(prisma.unit.findUnique).mockResolvedValueOnce(null)

    const response = await app.inject({
      method: 'PUT',
      url: '/units/223e4567-e89b-12d3-a456-426614174001',
      payload: {
        name: 'New Name',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message: 'Unit not found.' })
    expect(prisma.unit.update).not.toHaveBeenCalled()
  })
})
