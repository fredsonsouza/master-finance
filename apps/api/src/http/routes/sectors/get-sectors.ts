import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getSectors(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/sectors',
      {
        schema: {
          tags: ['sectors'],
          summary: 'Get all sectors',
          security: [{ bearerAuth: [] }],

          response: {
            200: z.object({
              sectors: z.array(
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

        if (ability.cannot('get', 'Sector')) {
          throw new UnauthorizedError('You are not allowed to view sectors.')
        }

        const sectors = await prisma.sector.findMany({
          orderBy: {
            createdAt: 'desc',
          },
        })

        return reply.status(200).send({ sectors })
      }
    )
}
