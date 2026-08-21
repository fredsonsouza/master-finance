import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

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
            value: z.number().nonnegative().optional(),
            categoryId: z.uuid().nullable().optional(),
            sectorId: z.uuid().nullable().optional(),
            quantity: z.number().int().min(0).optional(),
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

        if (ability.cannot('update', 'Item')) {
          throw new UnauthorizedError(
            'You are not allowed to update this item.'
          )
        }

        const { name, description, value, categoryId, sectorId, quantity } = request.body

        if (categoryId) {
          const category = await prisma.category.findUnique({
            where: { id: categoryId },
          })
          if (!category) {
            throw new BadRequestError('Category not found.')
          }
        }

        if (sectorId) {
          const sector = await prisma.sector.findUnique({
            where: { id: sectorId },
          })
          if (!sector) {
            throw new BadRequestError('Sector not found.')
          }
        }

        const updatedItem = await prisma.item.update({
          where: { id: targetItemId },
          data: {
            name: name ?? targetItem.name,
            description:
              description !== undefined ? description : targetItem.description,
            value: value !== undefined ? value : targetItem.value,
            categoryId:
              categoryId !== undefined ? categoryId : targetItem.categoryId,
            sectorId: sectorId !== undefined ? sectorId : targetItem.sectorId,
            quantity: quantity !== undefined ? quantity : targetItem.quantity,
          },
        })

        await logAction({
          userId,
          action: 'UPDATE',
          resource: 'ITEM',
          resourceId: targetItemId,
          details: `Editou o item/procedimento ${updatedItem.name}`,
        })

        return reply.status(204).send(null)
      }
    )
}
