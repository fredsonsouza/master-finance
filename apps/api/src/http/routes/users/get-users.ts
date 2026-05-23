import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
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
          response: {
            200: z.object({
              users: z.array(
                z.object({
                  id: z.uuid(),
                  name: z.string(),
                  username: z.string(),
                  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']),
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

        if (ability.cannot('manage', 'User')) {
          throw new UnauthorizedError('You are not allowed to view users.')
        }

        const users = await prisma.user.findMany({
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
