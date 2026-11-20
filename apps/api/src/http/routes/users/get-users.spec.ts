import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getUsers } from './get-users'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('Get Users Unit Test', () => {
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
      return reply.status(500).send({ message: error.message })
    })

    await app.register(getUsers)
  })

  test('should allow user with users:manage to view users with pagination', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      permissions: ['users:manage'],
    } as any)

    vi.mocked(prisma.user.count).mockResolvedValueOnce(2)
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        name: 'John',
        username: 'john',
        role: 'EMPLOYEE',
        permissions: ['transactions:manage'],
        unitId: '423e4567-e89b-12d3-a456-426614174003',
        avatarUrl: null,
        employee: null,
      },
      {
        id: '323e4567-e89b-12d3-a456-426614174002',
        name: 'Jane',
        username: 'jane',
        role: 'ADMIN',
        permissions: [],
        unitId: null,
        avatarUrl: null,
        employee: null,
      },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/users',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      users: [
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          name: 'John',
          username: 'john',
          role: 'EMPLOYEE',
          permissions: ['transactions:manage'],
          unitId: '423e4567-e89b-12d3-a456-426614174003',
          avatarUrl: null,
          employee: null,
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174002',
          name: 'Jane',
          username: 'jane',
          role: 'ADMIN',
          permissions: [],
          unitId: null,
          avatarUrl: null,
          employee: null,
        },
      ],
      pagination: {
        page: 1,
        perPage: 20,
        totalCount: 2,
        totalPages: 1,
      },
    })
  })

  test('should block basic EMPLOYEE without user permissions from viewing users', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      permissions: [],
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/users',
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({
      message: 'You are not allowed to view users.',
    })
    expect(prisma.user.findMany).not.toHaveBeenCalled()
  })

  test('should auto-scope collections:manage user (Fiscal) to COLLECTION department/permission staff', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      permissions: ['scope:all_units', 'collections:manage'],
      unitId: null,
    } as any)

    vi.mocked(prisma.user.count).mockResolvedValueOnce(1)
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
      {
        id: '523e4567-e89b-12d3-a456-426614174005',
        name: 'Maria Coletadora',
        username: 'MASTER-MC0001',
        role: 'EMPLOYEE',
        permissions: ['collections:execute'],
        unitId: '423e4567-e89b-12d3-a456-426614174003',
        avatarUrl: null,
        employee: {
          id: '623e4567-e89b-12d3-a456-426614174006',
          registrationNumber: 'MASTER-MC0001',
          status: 'ACTIVE',
          department: {
            id: 'd0000002-0000-4000-8000-000000000002',
            name: 'Coleta',
            type: 'COLLECTION',
          },
        },
      },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/users?departmentType=COLLECTION&page=1&perPage=200',
    })

    expect(response.statusCode).toBe(200)
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: expect.arrayContaining([
            { NOT: { employee: { is: { status: 'INACTIVE' } } } },
            {
              OR: [
                {
                  employee: {
                    is: { department: { is: { type: 'COLLECTION' } } },
                  },
                },
                { permissions: { has: 'collections:execute' } },
              ],
            },
          ]),
        },
      })
    )
    expect(response.json().users).toHaveLength(1)
  })

  test('should support hybrid departmentType=RECEPTION filtering', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
      permissions: [],
    } as any)

    vi.mocked(prisma.user.count).mockResolvedValueOnce(1)
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
      {
        id: '723e4567-e89b-12d3-a456-426614174007',
        name: 'Ana Recepção',
        username: 'MASTER-AR0001',
        role: 'EMPLOYEE',
        permissions: ['cash_closures:create', 'evaluations:receive'],
        unitId: '423e4567-e89b-12d3-a456-426614174003',
        avatarUrl: null,
        employee: null,
      },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/users?departmentType=RECEPTION',
    })

    expect(response.statusCode).toBe(200)
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: expect.arrayContaining([
            { NOT: { employee: { is: { status: 'INACTIVE' } } } },
            {
              OR: [
                {
                  employee: {
                    is: { department: { is: { type: 'RECEPTION' } } },
                  },
                },
                { permissions: { has: 'evaluations:receive' } },
              ],
            },
          ]),
        },
      })
    )
  })
})
