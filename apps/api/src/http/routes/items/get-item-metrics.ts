import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getItemMetrics(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/items/:id/metrics',
      {
        schema: {
          tags: ['items'],
          summary: 'Get item metrics like stock and last price',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          querystring: z.object({
            unitId: z.string().uuid().optional(),
          }),
          response: {
            200: z.object({
              currentStock: z.number(),
              lastPrice: z.number().nullable(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const itemId = request.params.id
        const { unitId } = request.query

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

        if (ability.cannot('get', 'Item')) {
          throw new UnauthorizedError('You are not allowed to view items.')
        }

        const item = await prisma.item.findUnique({
          where: { id: itemId },
        })

        if (!item) {
          throw new ResourceNotFoundError('Item not found.')
        }

        const transactions = await prisma.transaction.findMany({
          where: { itemId, unitId },
          select: { type: true, quantity: true, value: true, date: true },
          orderBy: { date: 'desc' },
        })

        let currentStock = item.quantity || 0
        let lastPrice: number | null = null

        for (const tx of transactions) {
          if (tx.type === 'ENTRY') {
            currentStock += tx.quantity
            if (lastPrice === null) {
              lastPrice = tx.value
            }
          } else if (tx.type === 'EXIT') {
            currentStock -= tx.quantity
          }
        }

        return reply.status(200).send({
          currentStock,
          lastPrice,
        })
      }
    )
}
