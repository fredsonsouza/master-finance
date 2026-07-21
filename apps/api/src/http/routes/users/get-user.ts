import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getUser(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/users/:id',
      {
        schema: {
          tags: ['users'],
          summary: 'Get user details',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.uuid(),
          }),
          response: {
            200: z.object({
              user: z.object({
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
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const targetUserId = request.params.id

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

        const user = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            unitId: true,
            avatarUrl: true,
          },
        })

        if (!user) {
          throw new ResourceNotFoundError('User not found.')
        }

        return reply.status(200).send({ user })
      }
    )
}
