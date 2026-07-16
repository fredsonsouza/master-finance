import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getExecutiveReports(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/metrics/reports/executive',
      {
        schema: {
          tags: ['metrics', 'reports'],
          summary: 'Get executive report data',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            unitId: z.string().uuid().optional(),
            month: z.string().optional(),
          }),
          response: {
            200: z.object({
              monthlyFlow: z.array(
                z.object({
                  month: z.string(),
                  entries: z.number(),
                  exits: z.number(),
                })
              ),
              topItems: z.array(
                z.object({
                  name: z.string(),
                  cost: z.number(),
                  quantity: z.number(),
                })
              ),
              costBySector: z.array(
                z.object({
                  name: z.string(),
                  cost: z.number(),
                })
              ),
              costByUnit: z.array(
                z.object({
                  name: z.string(),
                  cost: z.number(),
                })
              ),
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

        if (
          requestingUser.role !== 'MANAGER' &&
          requestingUser.role !== 'ADMIN'
        ) {
          throw new UnauthorizedError()
        }

        const { unitId, month } = request.query

        // Fetch ALL transactions for the selected unit to calculate historical monthly flow
        const transactions = await prisma.transaction.findMany({
          where: { unitId },
          select: {
            month: true,
            type: true,
            value: true,
            quantity: true,
            item: {
              select: { name: true, sector: { select: { name: true } } },
            },
            unit: { select: { name: true } },
          },
        })

        const monthlyMap = new Map<
          string,
          { month: string; entries: number; exits: number }
        >()
        const itemsMap = new Map<
          string,
          { name: string; cost: number; quantity: number }
        >()
        const sectorMap = new Map<string, { name: string; cost: number }>()
        const unitMap = new Map<string, { name: string; cost: number }>()

        for (const tx of transactions) {
          const val = tx.value * tx.quantity

          // Monthly Flow (Always considers all months)
          if (!monthlyMap.has(tx.month)) {
            monthlyMap.set(tx.month, { month: tx.month, entries: 0, exits: 0 })
          }
          const mFlow = monthlyMap.get(tx.month)!
          if (tx.type === 'ENTRY') mFlow.entries += val
          if (tx.type === 'EXIT') mFlow.exits += val

          // Top Items, Sectors, Units (Only consider if it matches the selected month, or if no month is selected)
          if (tx.type === 'EXIT' && (!month || tx.month === month)) {
            // Top Items
            if (!itemsMap.has(tx.item.name)) {
              itemsMap.set(tx.item.name, {
                name: tx.item.name,
                cost: 0,
                quantity: 0,
              })
            }
            const iMap = itemsMap.get(tx.item.name)!
            iMap.cost += val
            iMap.quantity += tx.quantity

            // Sectors
            const sName = tx.item.sector?.name || 'Sem Setor'
            if (!sectorMap.has(sName)) {
              sectorMap.set(sName, { name: sName, cost: 0 })
            }
            sectorMap.get(sName)!.cost += val

            // Units
            const uName = tx.unit.name
            if (!unitMap.has(uName)) {
              unitMap.set(uName, { name: uName, cost: 0 })
            }
            unitMap.get(uName)!.cost += val
          }
        }

        // Sort data
        const monthlyFlow = Array.from(monthlyMap.values()).sort((a, b) =>
          a.month.localeCompare(b.month)
        )
        const topItems = Array.from(itemsMap.values())
          .sort((a, b) => b.cost - a.cost)
          .slice(0, 10)
        const costBySector = Array.from(sectorMap.values()).sort(
          (a, b) => b.cost - a.cost
        )
        const costByUnit = Array.from(unitMap.values()).sort(
          (a, b) => b.cost - a.cost
        )

        return reply.status(200).send({
          monthlyFlow,
          topItems,
          costBySector,
          costByUnit,
        })
      }
    )
}
