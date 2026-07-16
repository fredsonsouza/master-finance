import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

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
          include: {
            item: {
              select: {
                name: true,
              },
            },
            unit: {
              select: {
                name: true,
              },
            },
          },
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

        const valFormatted =
          typeof transaction.value === 'number'
            ? transaction.value.toFixed(2)
            : '0.00'
        const qtyFormatted = transaction.quantity ?? 0

        await logAction({
          userId,
          action: 'DELETE',
          resource: 'TRANSACTION',
          resourceId: targetTransactionId,
          details: `Excluiu movimentação de ${transaction.type === 'ENTRY' ? 'ENTRADA' : 'SAÍDA'} de ${qtyFormatted}x ${transaction.item?.name ?? ''} no valor de R$ ${valFormatted} (Unidade: ${transaction.unit?.name ?? ''})`,
        })

        return reply.status(204).send(null)
      }
    )
}
