import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function deleteItem(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/items/:id',
      {
        schema: {
          tags: ['items'],
          summary: 'Delete an item',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.uuid(),
          }),
          response: {
            204: z.null(),
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

        const targetItem = await prisma.item.findUnique({
          where: { id: targetItemId },
        })

        if (!targetItem) {
          throw new BadRequestError('Item not found.')
        }

        if (
          ability.cannot('delete', {
            __typename: 'Item',
            unitId: targetItem.unitId,
          } as any)
        ) {
          throw new UnauthorizedError(
            'You are not allowed to delete this item.'
          )
        }

        await prisma.item.delete({
          where: { id: targetItemId },
        })

        return reply.status(204).send(null)
      }
    )
}
