import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import {
  type Permission,
  defineAbilityFor,
  hasAnyPermission,
  hasPermission,
  permissionSchema,
  roleSchema,
} from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getUsers(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/users',
      {
        schema: {
          tags: ['users'],
          summary: 'Get all users with search, filtering and pagination',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            search: z.string().optional(),
            unitId: z.string().uuid().optional(),
            role: roleSchema.optional(),
            permission: permissionSchema.optional(),
            departmentType: z
              .enum(['GENERAL', 'RECEPTION', 'COLLECTION'])
              .optional(),
            onlyActive: z.coerce.boolean().optional(),
            page: z.coerce.number().int().min(1).default(1),
            perPage: z.coerce.number().int().min(1).max(200).default(20),
          }),
          response: {
            200: z.object({
              users: z.array(
                z.object({
                  id: z.uuid(),
                  name: z.string(),
                  username: z.string(),
                  role: roleSchema,
                  permissions: z.array(z.string()),
                  unitId: z.uuid().nullable(),
                  avatarUrl: z.string().nullable(),
                  employee: z
                    .object({
                      id: z.uuid(),
                      registrationNumber: z.string(),
                      status: z.enum(['ACTIVE', 'INACTIVE']),
                      department: z
                        .object({
                          id: z.uuid(),
                          name: z.string(),
                          type: z.enum(['GENERAL', 'RECEPTION', 'COLLECTION']),
                        })
                        .nullable(),
                    })
                    .nullable()
                    .optional(),
                })
              ),
              pagination: z.object({
                page: z.number(),
                perPage: z.number(),
                totalCount: z.number(),
                totalPages: z.number(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const requestingUser = await prisma.user.findUnique({
          where: { id: userId },
        })

        if (!requestingUser) {
          throw new UnauthorizedError()
        }

        const ability = defineAbilityFor({
          id: requestingUser.id,
          role: requestingUser.role,
          unitId: requestingUser.unitId,
          permissions: requestingUser.permissions as Permission[],
        })

        if (ability.cannot('get', 'User')) {
          throw new UnauthorizedError('You are not allowed to view users.')
        }

        const {
          search,
          unitId,
          role,
          permission,
          departmentType,
          onlyActive,
          page,
          perPage,
        } = request.query

        let effectiveDepartmentType = departmentType

        // If user only has collections:manage (Fiscal profile) and no broader user-listing permissions,
        // auto-restrict listing to collection staff
        const hasBroaderUserAccess =
          requestingUser.role === 'ADMIN' ||
          hasAnyPermission(requestingUser, [
            'users:manage',
            'employees:manage',
            'evaluations:manage',
            'cash_closures:manage',
            'hr_reports:manage',
          ])

        if (
          !hasBroaderUserAccess &&
          hasPermission(requestingUser, 'collections:manage')
        ) {
          effectiveDepartmentType = 'COLLECTION'
        }

        const andConditions: any[] = []

        if (unitId) {
          andConditions.push({ unitId })
        }

        if (role) {
          andConditions.push({ role })
        }

        if (permission) {
          andConditions.push({
            OR: [{ role: 'ADMIN' }, { permissions: { has: permission } }],
          })
        }

        if (effectiveDepartmentType === 'RECEPTION') {
          andConditions.push({
            NOT: { employee: { is: { status: 'INACTIVE' } } },
          })
          andConditions.push({
            OR: [
              {
                employee: {
                  is: { department: { is: { type: 'RECEPTION' } } },
                },
              },
              { permissions: { has: 'evaluations:receive' } },
            ],
          })
        } else if (effectiveDepartmentType === 'COLLECTION') {
          andConditions.push({
            NOT: { employee: { is: { status: 'INACTIVE' } } },
          })
          andConditions.push({
            OR: [
              {
                employee: {
                  is: { department: { is: { type: 'COLLECTION' } } },
                },
              },
              { permissions: { has: 'collections:execute' } },
            ],
          })
        } else if (effectiveDepartmentType === 'GENERAL') {
          andConditions.push({
            employee: {
              is: { department: { is: { type: 'GENERAL' } } },
            },
          })
        }

        if (onlyActive) {
          andConditions.push({
            NOT: { employee: { is: { status: 'INACTIVE' } } },
          })
        }

        if (search?.trim()) {
          const term = search.trim()
          andConditions.push({
            OR: [
              {
                name: {
                  contains: term,
                  mode: 'insensitive' as const,
                },
              },
              {
                username: {
                  contains: term,
                  mode: 'insensitive' as const,
                },
              },
              {
                employee: {
                  is: {
                    registrationNumber: {
                      contains: term,
                      mode: 'insensitive' as const,
                    },
                  },
                },
              },
            ],
          })
        }

        const where = andConditions.length > 0 ? { AND: andConditions } : {}

        const totalCount = await prisma.user.count({ where })
        const totalPages = Math.ceil(totalCount / perPage) || 1

        const rawUsers = await prisma.user.findMany({
          where,
          skip: (page - 1) * perPage,
          take: perPage,
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            permissions: true,
            unitId: true,
            avatarUrl: true,
            employee: {
              select: {
                id: true,
                registrationNumber: true,
                status: true,
                department: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        })

        const users = rawUsers.map((u) => ({
          ...u,
          permissions: u.permissions ?? [],
        }))

        return reply.status(200).send({
          users,
          pagination: {
            page,
            perPage,
            totalCount,
            totalPages,
          },
        })
      }
    )
}
