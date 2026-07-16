import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
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
                  sectorId: z.string().uuid().nullable().optional(),
                  userId: z.string().uuid(),
                  batchId: z.string().uuid().nullable().optional(),
                  createdAt: z.date(),
                  updatedAt: z.date(),
                  item: z.object({
                    id: z.string().uuid(),
                    name: z.string(),
                    sector: z
                      .object({
                        id: z.string().uuid(),
                        name: z.string(),
                      })
                      .nullable()
                      .optional(),
                  }),
                  sector: z
                    .object({
                      id: z.string().uuid(),
                      name: z.string(),
                    })
                    .nullable()
                    .optional(),
                  unit: z
                    .object({
                      name: z.string(),
                    })
                    .optional(),
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
          take: 100, // Limita a 100 para não estourar a memória no acesso global
          where: {
            unitId,
            itemId,
            month,
            type,
          },
          include: {
            unit: {
              select: { name: true },
            },
            sector: {
              select: { id: true, name: true },
            },
            item: {
              include: {
                sector: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        })

        if (transactions.length > 0) {
          console.log(
            'DEBUG FIRST TX ITEM:',
            JSON.stringify(transactions[0].item, null, 2)
          )
        }

        return reply.status(200).send({ transactions })
      }
    )
}
