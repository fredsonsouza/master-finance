import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getTransactions(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/transactions',
      {
        schema: {
          tags: ['transactions'],
          summary: 'Get all transactions',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            unitId: z.string().uuid().optional(),
            itemId: z.string().uuid().optional(),
            month: z.string().optional(), // Expected YYYY-MM
            type: z.enum(['ENTRY', 'EXIT']).optional(),
          }),
          response: {
            200: z.object({
              transactions: z.array(
                z.object({
                  id: z.string().uuid(),
                  type: z.enum(['ENTRY', 'EXIT']),
                  date: z.date(),
                  month: z.string(),
                  value: z.number(),
                  quantity: z.number(),
                  itemId: z.string().uuid(),
                  unitId: z.string().uuid(),
                  userId: z.string().uuid(),
                  createdAt: z.date(),
                  updatedAt: z.date(),
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

        let { unitId, itemId, month, type } = request.query

        if (requestingUser.role === 'EMPLOYEE') {
          if (!requestingUser.unitId) {
            return reply.status(200).send({ transactions: [] })
          }
          unitId = requestingUser.unitId
        }

        const transactions = await prisma.transaction.findMany({
          where: {
            unitId,
            itemId,
            month,
            type,
          },
          orderBy: {
            date: 'desc',
          },
        })

        return reply.status(200).send({ transactions })
      }
    )
}
