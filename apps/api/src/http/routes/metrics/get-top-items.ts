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

        const transactions = await prisma.transaction.findMany({
          where: {
            month,
            type,
            ...(unitId ? { unitId } : {}),
          },
          select: {
            itemId: true,
            value: true,
            quantity: true,
            item: {
              select: {
                name: true,
              },
            },
          },
        })

        const itemTotalsMap = new Map<
          string,
          { itemId: string; itemName: string; totalValue: number }
        >()

        for (const tx of transactions) {
          const val = tx.value * tx.quantity
          if (!itemTotalsMap.has(tx.itemId)) {
            itemTotalsMap.set(tx.itemId, {
              itemId: tx.itemId,
              itemName: tx.item?.name || 'Unknown Item',
              totalValue: 0,
            })
          }
          itemTotalsMap.get(tx.itemId)!.totalValue += val
        }

        const sortedItems = Array.from(itemTotalsMap.values())
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, 5)
          .map((item) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            totalValue: Number(item.totalValue.toFixed(2)),
          }))

        return reply.status(200).send({ items: sortedItems })
      }
    )
}
