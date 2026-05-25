import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'

export async function getTransaction(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/transactions/:id',
      {
        schema: {
          tags: ['transactions'],
          summary: 'Get transaction details',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.uuid(),
          }),
          response: {
            200: z.object({
              transaction: z.object({
                id: z.uuid(),
                type: z.enum(['ENTRY', 'EXIT']),
                date: z.date(),
                month: z.string(),
                value: z.number(),
                quantity: z.number(),
                itemId: z.uuid(),
                unitId: z.uuid(),
                userId: z.uuid(),
                createdAt: z.date(),
                updatedAt: z.date(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const targetTransactionId = request.params.id

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

        const transaction = await prisma.transaction.findUnique({
          where: { id: targetTransactionId },
        })

        if (!transaction) {
          throw new ResourceNotFoundError('Transaction not found.')
        }

        if (
          ability.cannot('get', {
            __typename: 'Transaction',
            unitId: transaction.unitId,
          } as any)
        ) {
          throw new UnauthorizedError(
            'You are not allowed to view this transaction.'
          )
        }

        return reply.status(200).send({ transaction })
      }
    )
}
