import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { updateItem } from './update-item'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    sector: {
      findUnique: vi.fn(),
    },
    item: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

describe('Update Item Unit Test', () => {
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

    await app.register(updateItem)
  })

  test('should successfully update an item with category by INVENTORY user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'INVENTORY',
    } as any)

    vi.mocked(prisma.item.findUnique).mockResolvedValueOnce({
      id: '423e4567-e89b-12d3-a456-426614174003',
      name: 'Old Desk',
      description: null,
      value: 0,
      quantity: 10,
      categoryId: null,
      sectorId: null,
    } as any)

    vi.mocked(prisma.category.findUnique).mockResolvedValueOnce({
      id: '723e4567-e89b-12d3-a456-426614174007',
      name: 'Móveis',
    } as any)

    vi.mocked(prisma.item.update).mockResolvedValue({
      id: '423e4567-e89b-12d3-a456-426614174003',
      name: 'New Desk',
    } as any)

    const response = await app.inject({
      method: 'PUT',
      url: '/items/423e4567-e89b-12d3-a456-426614174003',
      payload: {
        name: 'New Desk',
        categoryId: '723e4567-e89b-12d3-a456-426614174007',
        value: 150.0,
      },
    })

    expect(response.statusCode).toBe(204)
    expect(prisma.item.update).toHaveBeenCalledWith({
      where: { id: '423e4567-e89b-12d3-a456-426614174003' },
      data: {
        name: 'New Desk',
        description: null,
        value: 150.0,
        categoryId: '723e4567-e89b-12d3-a456-426614174007',
        sectorId: null,
        quantity: 10,
      },
    })
  })
})
