import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { deleteItem } from './delete-item'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    item: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('Delete Item Unit Test', () => {
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

    await app.register(deleteItem)
  })

  test('should successfully delete an item within Employee unit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.item.findUnique).mockResolvedValueOnce({
      id: '423e4567-e89b-12d3-a456-426614174003',
      unitId: '223e4567-e89b-12d3-a456-426614174001', // Employee's unit
    } as any)

    vi.mocked(prisma.item.delete).mockResolvedValue({} as any)

    const response = await app.inject({
      method: 'DELETE',
      url: '/items/423e4567-e89b-12d3-a456-426614174003',
    })

    expect(response.statusCode).toBe(204)
    expect(prisma.item.delete).toHaveBeenCalledWith({
      where: { id: '423e4567-e89b-12d3-a456-426614174003' },
    })
  })

  test('should return 401 if Employee attempts to delete item outside their unit', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.item.findUnique).mockResolvedValueOnce({
      id: '423e4567-e89b-12d3-a456-426614174003',
      unitId: '999e4567-e89b-12d3-a456-426614174000', // External unit
    } as any)

    const response = await app.inject({
      method: 'DELETE',
      url: '/items/423e4567-e89b-12d3-a456-426614174003',
    })

    expect(response.statusCode).toBe(401)
    expect(prisma.item.delete).not.toHaveBeenCalled()
  })
})
