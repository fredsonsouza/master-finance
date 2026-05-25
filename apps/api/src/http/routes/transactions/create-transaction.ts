import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function createTransaction(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/transactions',
      {
        schema: {
          tags: ['transactions'],
          summary: 'Create a new transaction',
          security: [{ bearerAuth: [] }],
          body: z.object({
            type: z.enum(['ENTRY', 'EXIT']),
            date: z.coerce.date(),
            value: z.number().nonnegative(),
            quantity: z.number().int().positive(),
            itemId: z.uuid(),
            unitId: z.uuid(),
          }),
          response: {
            201: z.object({
              transactionId: z.uuid(),
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

        const ability = defineAbilityFor({
          id: requestingUser.id,
          role: requestingUser.role,
          unitId: requestingUser.unitId,
        } as any)

        const { type, date, value, quantity, itemId, unitId } = request.body

        if (
          ability.cannot('create', { __typename: 'Transaction', unitId } as any)
        ) {
          throw new UnauthorizedError(
            'You are not allowed to create a transaction in this unit.'
          )
        }

        // Validate unit
        const unit = await prisma.unit.findUnique({ where: { id: unitId } })
        if (!unit) {
          throw new BadRequestError('Unit not found.')
        }

        // Validate item
        const item = await prisma.item.findUnique({ where: { id: itemId } })
        if (!item) {
          throw new BadRequestError('Item not found.')
        }

        if (item.unitId !== unitId) {
          throw new BadRequestError(
            'Item does not belong to the specified unit.'
          )
        }

        // Extract month in YYYY-MM format from the date
        const monthString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        const transaction = await prisma.transaction.create({
          data: {
            type,
            date,
            month: monthString,
            value,
            quantity,
            itemId,
            unitId,
            userId, // The user performing the action
          },
        })

        return reply.status(201).send({ transactionId: transaction.id })
      }
    )
}
