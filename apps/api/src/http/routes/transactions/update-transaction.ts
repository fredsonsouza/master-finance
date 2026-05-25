import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function updateTransaction(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/transactions/:id',
      {
        schema: {
          tags: ['transactions'],
          summary: 'Update a transaction',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.uuid(),
          }),
          body: z.object({
            type: z.enum(['ENTRY', 'EXIT']).optional(),
            date: z.coerce.date().optional(),
            value: z.number().nonnegative().optional(),
            quantity: z.number().int().positive().optional(),
            itemId: z.uuid().optional(),
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
          ability.cannot('update', {
            __typename: 'Transaction',
            unitId: transaction.unitId,
          } as any)
        ) {
          throw new UnauthorizedError(
            'You are not allowed to update this transaction.'
          )
        }

        const { type, date, value, quantity, itemId } = request.body

        if (itemId) {
          const item = await prisma.item.findUnique({ where: { id: itemId } })
          if (!item) {
            throw new BadRequestError('Item not found.')
          }
          if (item.unitId !== transaction.unitId) {
            throw new BadRequestError(
              'Item does not belong to the transaction unit.'
            )
          }
        }

        let parsedDate = transaction.date
        let monthString = transaction.month

        if (date) {
          parsedDate = date
          monthString = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`
        }

        await prisma.transaction.update({
          where: { id: targetTransactionId },
          data: {
            type: type ?? transaction.type,
            date: parsedDate,
            month: monthString,
            value: value ?? transaction.value,
            quantity: quantity ?? transaction.quantity,
            itemId: itemId ?? transaction.itemId,
          },
        })

        return reply.status(204).send(null)
      }
    )
}
