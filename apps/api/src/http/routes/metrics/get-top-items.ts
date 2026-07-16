import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getTopItems(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/metrics/top-items',
      {
        schema: {
          tags: ['metrics'],
          summary: 'Get most active items for a month',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            month: z
              .string()
              .regex(/^\d{4}-\d{2}$/, 'Must be in YYYY-MM format'),
            type: z.enum(['ENTRY', 'EXIT']),
            unitId: z.uuid().optional(),
          }),
          response: {
            200: z.object({
              items: z.array(
                z.object({
                  itemId: z.string().uuid(),
                  itemName: z.string(),
                  totalValue: z.number(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { month, type, unitId } = request.query

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

        if (ability.cannot('get', 'Metric')) {
          throw new UnauthorizedError(
            'You do not have permission to view metrics.'
          )
        }

        const topTransactions = await prisma.transaction.groupBy({
          by: ['itemId'],
          _sum: { value: true },
          where: {
            month,
            type,
            ...(unitId ? { unitId } : {}),
          },
          orderBy: { _sum: { value: 'desc' } },
          take: 5,
        })

        const itemIds = topTransactions.map((t) => t.itemId)
        const items = await prisma.item.findMany({
          where: { id: { in: itemIds } },
          select: { id: true, name: true },
        })

        const itemsMap = new Map(items.map((i) => [i.id, i.name]))

        const result = topTransactions.map((t) => ({
          itemId: t.itemId,
          itemName: itemsMap.get(t.itemId) || 'Unknown Item',
          totalValue: t._sum.value || 0,
        }))

        return reply.status(200).send({ items: result })
      }
    )
}
