import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequestError } from '../_errors/bad-request-error'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { updateCategory } from './update-category'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

describe('Update Category Unit Test', () => {
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
      if (error instanceof ResourceNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }
      if (error instanceof BadRequestError || error.statusCode === 400) {
        return reply.status(400).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(updateCategory)
  })

  test('should allow ADMIN role to update a category', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
    } as any)

    vi.mocked(prisma.category.findUnique).mockResolvedValueOnce({
      id: '523e4567-e89b-12d3-a456-426614174005',
      name: 'Medicamento',
    } as any)

    vi.mocked(prisma.category.findFirst).mockResolvedValueOnce(null)

    vi.mocked(prisma.category.update).mockResolvedValueOnce({
      id: '523e4567-e89b-12d3-a456-426614174005',
      name: 'Medicamentos e Injetáveis',
    } as any)

    const response = await app.inject({
      method: 'PUT',
      url: '/categories/523e4567-e89b-12d3-a456-426614174005',
      payload: {
        name: 'Medicamentos e Injetáveis',
      },
    })

    expect(response.statusCode).toBe(204)
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: '523e4567-e89b-12d3-a456-426614174005' },
      data: { name: 'Medicamentos e Injetáveis' },
    })
  })

  test('should allow MANAGER role to update a category', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    vi.mocked(prisma.category.findUnique).mockResolvedValueOnce({
      id: '523e4567-e89b-12d3-a456-426614174005',
      name: 'Medicamento',
    } as any)

    vi.mocked(prisma.category.findFirst).mockResolvedValueOnce(null)

    vi.mocked(prisma.category.update).mockResolvedValueOnce({
      id: '523e4567-e89b-12d3-a456-426614174005',
      name: 'Medicamentos',
    } as any)

    const response = await app.inject({
      method: 'PUT',
      url: '/categories/523e4567-e89b-12d3-a456-426614174005',
      payload: {
        name: 'Medicamentos',
      },
    })

    expect(response.statusCode).toBe(204)
  })

  test('should allow INVENTORY role to update a category', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'INVENTORY',
    } as any)

    vi.mocked(prisma.category.findUnique).mockResolvedValueOnce({
      id: '523e4567-e89b-12d3-a456-426614174005',
      name: 'Medicamento',
    } as any)

    vi.mocked(prisma.category.findFirst).mockResolvedValueOnce(null)

    vi.mocked(prisma.category.update).mockResolvedValueOnce({
      id: '523e4567-e89b-12d3-a456-426614174005',
      name: 'Medicamentos',
    } as any)

    const response = await app.inject({
      method: 'PUT',
      url: '/categories/523e4567-e89b-12d3-a456-426614174005',
      payload: {
        name: 'Medicamentos',
      },
    })

    expect(response.statusCode).toBe(204)
  })

  test('should block EMPLOYEE role from updating a category', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const response = await app.inject({
      method: 'PUT',
      url: '/categories/523e4567-e89b-12d3-a456-426614174005',
      payload: {
        name: 'Medicamentos',
      },
    })

    expect(response.statusCode).toBe(401)
  })

  test('should block FINANCIAL role from updating a category', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'FINANCIAL',
    } as any)

    const response = await app.inject({
      method: 'PUT',
      url: '/categories/523e4567-e89b-12d3-a456-426614174005',
      payload: {
        name: 'Medicamentos',
      },
    })

    expect(response.statusCode).toBe(401)
  })

  test('should block SELLER role from updating a category', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'SELLER',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const response = await app.inject({
      method: 'PUT',
      url: '/categories/523e4567-e89b-12d3-a456-426614174005',
      payload: {
        name: 'Medicamentos',
      },
    })

    expect(response.statusCode).toBe(401)
  })

  test('should block FISCAL role from updating a category', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'FISCAL',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const response = await app.inject({
      method: 'PUT',
      url: '/categories/523e4567-e89b-12d3-a456-426614174005',
      payload: {
        name: 'Medicamentos',
      },
    })

    expect(response.statusCode).toBe(401)
  })

  test('should return 404 when category does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
    } as any)

    vi.mocked(prisma.category.findUnique).mockResolvedValueOnce(null)

    const response = await app.inject({
      method: 'PUT',
      url: '/categories/523e4567-e89b-12d3-a456-426614174005',
      payload: {
        name: 'Medicamentos',
      },
    })

    expect(response.statusCode).toBe(404)
  })

  test('should return 400 when category name is already in use by another category', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
    } as any)

    vi.mocked(prisma.category.findUnique).mockResolvedValueOnce({
      id: '523e4567-e89b-12d3-a456-426614174005',
      name: 'Medicamento',
    } as any)

    vi.mocked(prisma.category.findFirst).mockResolvedValueOnce({
      id: '623e4567-e89b-12d3-a456-426614174006',
      name: 'Medicamentos',
    } as any)

    const response = await app.inject({
      method: 'PUT',
      url: '/categories/523e4567-e89b-12d3-a456-426614174005',
      payload: {
        name: 'Medicamentos',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      message: 'Já existe uma categoria com este nome.',
    })
  })
})
