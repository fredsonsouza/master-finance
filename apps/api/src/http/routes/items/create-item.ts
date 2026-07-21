import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createItem(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/items',
      {
        schema: {
          tags: ['items'],
          summary: 'Create a new item',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string().min(1),
            description: z.string().nullable().optional(),
            sectorId: z.uuid().nullable().optional(),
            quantity: z.number().int().min(0).optional().default(0),
          }),
          response: {
            201: z.object({
              itemId: z.string(),
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

        const { name, description, sectorId, quantity } = request.body

        if (ability.cannot('create', 'Item')) {
          throw new UnauthorizedError(
            'You are not allowed to create an item.'
          )
        }

        if (sectorId) {
          const sector = await prisma.sector.findUnique({
            where: { id: sectorId },
          })
          if (!sector) {
            throw new BadRequestError('Sector not found.')
          }
        }

        const item = await prisma.item.create({
          data: {
            name,
            description,
            sectorId,
            quantity,
          },
        })

        await logAction({
          userId,
          action: 'CREATE',
          resource: 'ITEM',
          resourceId: item.id,
          details: `Criou o item/procedimento ${name} com quantidade inicial ${quantity}`,
        })

        return reply.status(201).send({ itemId: item.id })
      }
    )
}
