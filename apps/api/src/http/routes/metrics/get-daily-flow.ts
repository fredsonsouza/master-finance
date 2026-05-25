import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import dayjs from 'dayjs'

export async function getDailyFlow(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/metrics/daily-flow',
      {
        schema: {
          tags: ['metrics'],
          summary: 'Get daily transaction totals for a month',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            month: z
              .string()
              .regex(/^\d{4}-\d{2}$/, 'Must be in YYYY-MM format'),
            unitId: z.uuid().optional(),
          }),
          response: {
            200: z.object({
              flow: z.array(
                z.object({
                  day: z.string(),
                  entries: z.number(),
                  exits: z.number(),
                })
              ),
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

        const transactions = await prisma.transaction.findMany({
          where: {
            month,
            ...(unitId ? { unitId } : {}),
          },
          select: {
            type: true,
            value: true,
            date: true,
          },
        })

        const daysInMonth = dayjs(`${month}-01`).daysInMonth()
        const dailyFlow: Record<string, { entries: number; exits: number }> = {}

        for (let i = 1; i <= daysInMonth; i++) {
          const dayString = String(i).padStart(2, '0')
          dailyFlow[dayString] = { entries: 0, exits: 0 }
        }

        transactions.forEach((t) => {
          const dayString = dayjs(t.date).format('DD')
          if (dailyFlow[dayString]) {
            if (t.type === 'ENTRY') {
              dailyFlow[dayString].entries += t.value
            } else if (t.type === 'EXIT') {
              dailyFlow[dayString].exits += t.value
            }
          }
        })

        const flowArray = Object.entries(dailyFlow)
          .map(([day, data]) => ({
            day,
            entries: data.entries,
            exits: data.exits,
          }))
          .sort((a, b) => a.day.localeCompare(b.day))

        return reply.status(200).send({ flow: flowArray })
      }
    )
}
