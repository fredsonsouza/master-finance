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
          summary: 'Get all users',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
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
              ])
              .optional(),
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
                  ]),
                  unitId: z.uuid().nullable(),
                  avatarUrl: z.url().nullable(),
                })
              ),
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

        const { unitId, role } = request.query

        const users = await prisma.user.findMany({
          where: {
            unitId,
            role,
          },
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            unitId: true,
            avatarUrl: true,
          },
        })

        return reply.status(200).send({ users })
      }
    )
}
