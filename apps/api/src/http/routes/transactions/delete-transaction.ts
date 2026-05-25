import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function deleteTransaction(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/transactions/:id',
      {
        schema: {
          tags: ['transactions'],
          summary: 'Delete a transaction',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.uuid(),
          }),
          response: {
            204: z.null(),
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
          throw new BadRequestError('Transaction not found.')
        }

        if (
          ability.cannot('delete', {
            __typename: 'Transaction',
            unitId: transaction.unitId,
          } as any)
        ) {
          throw new UnauthorizedError(
            'You are not allowed to delete this transaction.'
          )
        }

        await prisma.transaction.delete({
          where: { id: targetTransactionId },
        })

        return reply.status(204).send(null)
      }
    )
}
