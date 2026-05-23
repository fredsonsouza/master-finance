import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getUnits(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/units',
      {
        schema: {
          tags: ['units'],
          summary: 'Get all units',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              units: z.array(
                z.object({
                  id: z.uuid(),
                  name: z.string(),
                  createdAt: z.date(),
                  updatedAt: z.date(),
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

        // Only ADMIN and MANAGER can manage/read all units unconditionally according to the permissions.ts
        if (ability.cannot('manage', 'Unit')) {
          throw new UnauthorizedError('You are not allowed to view all units.')
        }

        const units = await prisma.unit.findMany({
          orderBy: {
            createdAt: 'desc',
          },
        })

        return reply.status(200).send({ units })
      }
    )
}
