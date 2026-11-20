import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { createDepartment } from './create-department'
import { deleteDepartment } from './delete-department'
import { getDepartments } from './get-departments'
import { updateDepartment } from './update-department'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    department: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

describe('Departments CRUD Unit Tests', () => {
  let app: ReturnType<typeof fastify>
  const userId = '123e4567-e89b-12d3-a456-426614174000'
  const deptId = 'd0000001-0000-4000-8000-000000000001'

  beforeEach(async () => {
    vi.clearAllMocks()
    app = fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    app.decorateRequest('jwtVerify', vi.fn().mockResolvedValue({ sub: userId }))

    app.setErrorHandler((error: any, _request: any, reply: any) => {
      if (error instanceof UnauthorizedError) {
        return reply.status(401).send({ message: error.message })
      }
      if (error instanceof BadRequestError || error.statusCode === 400) {
        return reply.status(400).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(createDepartment)
    await app.register(getDepartments)
    await app.register(updateDepartment)
    await app.register(deleteDepartment)
  })

  test('should allow HR employee (employees:manage) to create a RECEPTION department', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: userId,
      role: 'EMPLOYEE',
      permissions: ['employees:manage'],
    } as any)
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce(null)
    vi.mocked(prisma.department.create).mockResolvedValueOnce({
      id: deptId,
      name: 'Recepção Matriz',
      type: 'RECEPTION',
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/departments',
      payload: {
        name: 'Recepção Matriz',
        type: 'RECEPTION',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({ departmentId: deptId })
  })

  test('should block regular EMPLOYEE without employees:manage or settings:structure from creating a department', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: userId,
      role: 'EMPLOYEE',
      permissions: [],
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/departments',
      payload: {
        name: 'Novo Depto',
        type: 'GENERAL',
      },
    })

    expect(response.statusCode).toBe(401)
    expect(prisma.department.create).not.toHaveBeenCalled()
  })

  test('should allow listing departments with employee counts', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: userId,
      role: 'EMPLOYEE',
      permissions: [],
    } as any)
    const now = new Date('2026-11-20T12:00:00.000Z')
    vi.mocked(prisma.department.findMany).mockResolvedValueOnce([
      {
        id: deptId,
        name: 'Recepção',
        type: 'RECEPTION',
        createdAt: now,
        updatedAt: now,
        _count: { employees: 4 },
      },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/departments',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      departments: [
        {
          id: deptId,
          name: 'Recepção',
          type: 'RECEPTION',
          employeesCount: 4,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ],
    })
  })

  test('should allow renaming and deleting a department by ADMIN', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: userId,
      role: 'ADMIN',
      permissions: [],
    } as any)
    vi.mocked(prisma.department.findUnique).mockResolvedValueOnce({
      id: deptId,
      name: 'Recepção',
      type: 'RECEPTION',
    } as any)
    vi.mocked(prisma.department.findFirst).mockResolvedValueOnce(null)
    vi.mocked(prisma.department.update).mockResolvedValueOnce({
      id: deptId,
      name: 'Atendimento / Recepção',
      type: 'RECEPTION',
    } as any)

    const updateRes = await app.inject({
      method: 'PUT',
      url: `/departments/${deptId}`,
      payload: {
        name: 'Atendimento / Recepção',
      },
    })

    expect(updateRes.statusCode).toBe(204)

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: userId,
      role: 'ADMIN',
      permissions: [],
    } as any)
    vi.mocked(prisma.department.findUnique).mockResolvedValueOnce({
      id: deptId,
      name: 'Atendimento / Recepção',
      type: 'RECEPTION',
    } as any)
    vi.mocked(prisma.department.delete).mockResolvedValueOnce({} as any)

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/departments/${deptId}`,
    })

    expect(deleteRes.statusCode).toBe(204)
  })
})
