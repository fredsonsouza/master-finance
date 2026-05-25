import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'
import dayjs from 'dayjs'

export async function getSummary(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/metrics/summary',
      {
        schema: {
          tags: ['metrics'],
          summary: 'Get financial summary for a month',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            month: z
              .string()
              .regex(/^\d{4}-\d{2}$/, 'Must be in YYYY-MM format'),
            unitId: z.uuid().optional(),
          }),
          response: {
            200: z.object({
              totalEntries: z.number(),
              totalExits: z.number(),
              balance: z.number(),
              entriesVariation: z.number().nullable(),
              exitsVariation: z.number().nullable(),
              balanceVariation: z.number().nullable(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { month, unitId } = request.query

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

        const [year, monthNum] = month.split('-')
        const previousMonth = dayjs(`${year}-${monthNum}-01`)
          .subtract(1, 'month')
          .format('YYYY-MM')

        const currentMonthTransactions = await prisma.transaction.findMany({
          where: {
            month,
            ...(unitId ? { unitId } : {}),
          },
          select: { type: true, value: true },
        })

        const previousMonthTransactions = await prisma.transaction.findMany({
          where: {
            month: previousMonth,
            ...(unitId ? { unitId } : {}),
          },
          select: { type: true, value: true },
        })

        const calculateTotals = (
          transactions: { type: 'ENTRY' | 'EXIT'; value: number }[]
        ) => {
          let entries = 0
          let exits = 0
          transactions.forEach((t) => {
            if (t.type === 'ENTRY') entries += t.value
            else if (t.type === 'EXIT') exits += t.value
          })
          return { entries, exits, balance: entries - exits }
        }

        const current = calculateTotals(currentMonthTransactions as any)
        const previous = calculateTotals(previousMonthTransactions as any)

        const calculateVariation = (
          currentValue: number,
          previousValue: number
        ) => {
          if (previousValue === 0) {
            return currentValue > 0 ? 100 : currentValue < 0 ? -100 : 0 // Basic fallback for zero
          }
          return (
            ((currentValue - previousValue) / Math.abs(previousValue)) * 100
          )
        }

        return reply.status(200).send({
          totalEntries: current.entries,
          totalExits: current.exits,
          balance: current.balance,
          entriesVariation: calculateVariation(
            current.entries,
            previous.entries
          ),
          exitsVariation: calculateVariation(current.exits, previous.exits),
          balanceVariation: calculateVariation(
            current.balance,
            previous.balance
          ),
        })
      }
    )
}
