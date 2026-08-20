import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

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
                quantity: z.number().int(),
                categoryId: z.string().uuid().nullable().optional(),
                sectorId: z.string().uuid().nullable().optional(),
                createdAt: z.date(),
                updatedAt: z.date(),
                category: z
                  .object({
                    id: z.string().uuid(),
                    name: z.string(),
                  })
                  .nullable()
                  .optional(),
                sector: z
                  .object({
                    id: z.string().uuid(),
                    name: z.string(),
                  })
                  .nullable()
                  .optional(),
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
          include: {
            category: true,
            sector: true,
          },
        })

        if (!item) {
          throw new ResourceNotFoundError('Item not found.')
        }

        if (ability.cannot('get', 'Item')) {
          throw new UnauthorizedError('You are not allowed to view this item.')
        }

        return reply.status(200).send({ item })
      }
    )
}
