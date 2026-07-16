import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getDashboardMetrics(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/metrics/dashboard',
      {
        schema: {
          tags: ['metrics'],
          summary: 'Get dashboard grouped metrics',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            unitId: z.string().uuid().optional(),
          }),
          response: {
            200: z.object({
              groups: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  entries: z.number(),
                  exits: z.number(),
                  balance: z.number(),
                })
              ),
              totalEntries: z.number(),
              totalExits: z.number(),
              totalBalance: z.number(),
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

        let { unitId } = request.query

        if (requestingUser.role === 'EMPLOYEE') {
          if (!requestingUser.unitId) {
            return reply.status(200).send({
              groups: [],
              totalEntries: 0,
              totalExits: 0,
              totalBalance: 0,
            })
          }
          unitId = requestingUser.unitId
        }

        // Fetch all relevant transactions with their relations to group in memory
        // Using Prisma findMany is fast enough if we don't return large payloads
        // But for true DB aggregation we could use groupBy. Since we need to join Item/Sector and Unit,
        // Prisma groupBy doesn't support relation joins well. We will fetch only necessary fields for speed.
        const transactions = await prisma.transaction.findMany({
          where: { unitId },
          select: {
            value: true,
            quantity: true,
            type: true,
            item: {
              select: {
                sector: {
                  select: { id: true, name: true },
                },
              },
            },
            unit: {
              select: { id: true, name: true },
            },
          },
        })

        let totalEntries = 0
        let totalExits = 0
        const map = new Map<
          string,
          {
            id: string
            name: string
            entries: number
            exits: number
            balance: number
          }
        >()

        for (const tx of transactions) {
          const val = tx.value * tx.quantity
          let groupId = ''
          let groupName = ''

          if (unitId) {
            // Group by Sector
            groupId = tx.item?.sector?.id || 'unassigned'
            groupName = tx.item?.sector?.name || 'Sem Setor'
          } else {
            // Group by Unit
            groupId = tx.unit.id
            groupName = tx.unit.name
          }

          if (!map.has(groupId)) {
            map.set(groupId, {
              id: groupId,
              name: groupName,
              entries: 0,
              exits: 0,
              balance: 0,
            })
          }

          const group = map.get(groupId)!
          if (tx.type === 'ENTRY') {
            totalEntries += val
            group.entries += val
            group.balance += val
          } else if (tx.type === 'EXIT') {
            totalExits += val
            group.exits += val
            group.balance -= val
          }
        }

        const groups = Array.from(map.values()).sort(
          (a, b) => b.balance - a.balance
        )
        const totalBalance = totalEntries - totalExits

        return reply.status(200).send({
          groups,
          totalEntries,
          totalExits,
          totalBalance,
        })
      }
    )
}
