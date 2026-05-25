import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'

export async function getItem(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/items/:id',
      {
        schema: {
          tags: ['items'],
          summary: 'Get item details',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.uuid(),
          }),
          response: {
            200: z.object({
              item: z.object({
                id: z.string().uuid(),
                name: z.string(),
                description: z.string().nullable(),
                unitId: z.string().uuid(),
                sectorId: z.string().uuid().nullable(),
                createdAt: z.date(),
                updatedAt: z.date(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const targetItemId = request.params.id

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

        const item = await prisma.item.findUnique({
          where: { id: targetItemId },
        })

        if (!item) {
          throw new ResourceNotFoundError('Item not found.')
        }

        if (
          ability.cannot('get', {
            __typename: 'Item',
            unitId: item.unitId,
          } as any)
        ) {
          throw new UnauthorizedError('You are not allowed to view this item.')
        }

        return reply.status(200).send({ item })
      }
    )
}
