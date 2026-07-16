import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

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
            sectorId: z.uuid().optional(),
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

        const { type, date, value, quantity, itemId, sectorId } = request.body

        if (itemId) {
          const item = await prisma.item.findUnique({ where: { id: itemId } })
          if (!item) {
            throw new BadRequestError('Item not found.')
          }
        }

        if (sectorId) {
          const sector = await prisma.sector.findUnique({ where: { id: sectorId } })
          if (!sector) {
            throw new BadRequestError('Sector not found.')
          }
        }

        let parsedDate = transaction.date
        let monthString = transaction.month

        if (date) {
          parsedDate = date
          monthString = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`
        }

        const updated = await prisma.transaction.update({
          where: { id: targetTransactionId },
          data: {
            type: type ?? transaction.type,
            date: parsedDate,
            month: monthString,
            value: value ?? transaction.value,
            quantity: quantity ?? transaction.quantity,
            itemId: itemId ?? transaction.itemId,
            sectorId: sectorId ?? transaction.sectorId,
          },
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

        const valFormatted =
          typeof updated.value === 'number' ? updated.value.toFixed(2) : '0.00'
        const qtyFormatted = updated.quantity ?? 0

        await logAction({
          userId,
          action: 'UPDATE',
          resource: 'TRANSACTION',
          resourceId: targetTransactionId,
          details: `Editou movimentação de ${updated.type === 'ENTRY' ? 'ENTRADA' : 'SAÍDA'} de ${qtyFormatted}x ${updated.item?.name ?? ''} no valor de R$ ${valFormatted} (Unidade: ${updated.unit?.name ?? ''})`,
        })

        return reply.status(204).send(null)
      }
    )
}
