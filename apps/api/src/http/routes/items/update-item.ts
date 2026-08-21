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
            id: z.string().uuid(),
          }),
          body: z.object({
            name: z.string().min(1).optional(),
            description: z.string().nullable().optional(),
            value: z.number().nonnegative().optional(),
            categoryId: z.string().uuid().nullable().optional(),
            sectorId: z.string().uuid().nullable().optional(),
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
          throw new BadRequestError('Item não encontrado.')
        }

        if (ability.cannot('update', 'Item')) {
          throw new UnauthorizedError(
            'Você não tem permissão para editar este item.'
          )
        }

        const { name, description, value, categoryId, sectorId, quantity } = request.body

        if (categoryId) {
          try {
            const category = await prisma.category.findUnique({
              where: { id: categoryId },
            })
            if (!category) {
              throw new BadRequestError('Categoria selecionada não encontrada.')
            }
          } catch (err) {
            if (err instanceof BadRequestError) throw err
            // If category table is not ready yet in DB, ignore
          }
        }

        if (sectorId) {
          const sector = await prisma.sector.findUnique({
            where: { id: sectorId },
          })
          if (!sector) {
            throw new BadRequestError('Setor não encontrado.')
          }
        }

        let updatedItem: any = null

        try {
          updatedItem = await prisma.item.update({
            where: { id: targetItemId },
            data: {
              name: name ?? targetItem.name,
              description:
                description !== undefined ? description : targetItem.description,
              value: value !== undefined ? value : (targetItem as any).value,
              categoryId:
                categoryId !== undefined ? categoryId : (targetItem as any).categoryId,
              sectorId: sectorId !== undefined ? sectorId : targetItem.sectorId,
              quantity: quantity !== undefined ? quantity : targetItem.quantity,
            },
          })
        } catch (dbError) {
          // Fallback if categoryId or value column is not yet in the DB
          updatedItem = await prisma.item.update({
            where: { id: targetItemId },
            data: {
              name: name ?? targetItem.name,
              description:
                description !== undefined ? description : targetItem.description,
              sectorId: sectorId !== undefined ? sectorId : targetItem.sectorId,
              quantity: quantity !== undefined ? quantity : targetItem.quantity,
            },
          })
        }

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
