import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function updateItem(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/items/:id',
      {
        schema: {
          tags: ['items'],
          summary: 'Update an item',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.uuid(),
          }),
          body: z.object({
            name: z.string().min(1).optional(),
            description: z.string().nullable().optional(),
            sectorId: z.uuid().nullable().optional(),
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
          ability.cannot('update', {
            __typename: 'Item',
            unitId: targetItem.unitId,
          } as any)
        ) {
          throw new UnauthorizedError(
            'You are not allowed to update this item.'
          )
        }

        const { name, description, sectorId } = request.body

        if (sectorId) {
          const sector = await prisma.sector.findUnique({
            where: { id: sectorId },
          })
          if (!sector) {
            throw new BadRequestError('Sector not found.')
          }
          if (sector.unitId !== targetItem.unitId) {
            throw new BadRequestError(
              'Sector does not belong to the item unit.'
            )
          }
        }

        // We explicitly avoid allowing `unitId` modification here to prevent complex transfer edge-cases
        // Transferring items across units might have financial implications if it has transactions
        await prisma.item.update({
          where: { id: targetItemId },
          data: {
            name: name ?? targetItem.name,
            description:
              description !== undefined ? description : targetItem.description,
            sectorId: sectorId !== undefined ? sectorId : targetItem.sectorId,
          },
        })

        return reply.status(204).send(null)
      }
    )
}
