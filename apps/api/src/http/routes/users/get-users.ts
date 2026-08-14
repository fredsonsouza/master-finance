import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
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
            role: z
              .enum([
                'ADMIN',
                'MANAGER',
                'EMPLOYEE',
                'FINANCIAL',
                'SELLER',
                'COLLECTOR',
                'FISCAL',
                'INVENTORY',
              ])
              .optional(),
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
                  role: z.enum([
                    'ADMIN',
                    'MANAGER',
                    'EMPLOYEE',
                    'FINANCIAL',
                    'SELLER',
                    'COLLECTOR',
                    'FISCAL',
                    'INVENTORY',
                  ]),
                  unitId: z.uuid().nullable(),
                  avatarUrl: z.url().nullable(),
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
        } as any)

        if (ability.cannot('get', 'User')) {
          throw new UnauthorizedError('You are not allowed to view users.')
        }

        const { search, unitId, role, page, perPage } = request.query

        const where = {
          unitId: unitId || undefined,
          role: role || undefined,
          OR: search?.trim()
            ? [
                { name: { contains: search.trim(), mode: 'insensitive' as const } },
                { username: { contains: search.trim(), mode: 'insensitive' as const } },
              ]
            : undefined,
        }

        const totalCount = await prisma.user.count({ where })
        const totalPages = Math.ceil(totalCount / perPage) || 1

        const users = await prisma.user.findMany({
          where,
          skip: (page - 1) * perPage,
          take: perPage,
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            unitId: true,
            avatarUrl: true,
          },
          orderBy: {
            name: 'asc',
          },
        })

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
