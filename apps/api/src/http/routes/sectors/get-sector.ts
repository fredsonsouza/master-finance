import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getSector(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/sectors/:id',
      {
        schema: {
          tags: ['sectors'],
          summary: 'Get sector details',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.uuid(),
          }),
          response: {
            200: z.object({
              sector: z.object({
                id: z.uuid(),
                name: z.string(),
                createdAt: z.date(),
                updatedAt: z.date(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const targetSectorId = request.params.id

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

        const sector = await prisma.sector.findUnique({
          where: { id: targetSectorId },
        })

        if (!sector) {
          throw new ResourceNotFoundError('Sector not found.')
        }

        if (
          ability.cannot('get', {
            __typename: 'Sector',
          } as any)
        ) {
          throw new UnauthorizedError(
            'You are not allowed to view this sector.'
          )
        }

        return reply.status(200).send({ sector })
      }
    )
}
