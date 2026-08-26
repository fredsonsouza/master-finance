import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function updateCashClosure(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/cash-closures/:id',
      {
        schema: {
          tags: ['cash-closures'],
          summary: 'Update a cash closure',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            cashDate: z.string().datetime(),
            value: z.number(),
            observation: z.string().optional(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { id } = request.params
        const { cashDate, value, observation } = request.body

        const userId = await request.getCurrentUserId()
        const user = await prisma.user.findUnique({ where: { id: userId } })

        if (!user) {
          throw new UnauthorizedError()
        }

        const closure = await prisma.cashClosure.findUnique({
          where: { id },
        })

        if (!closure) {
          throw new ResourceNotFoundError('Lançamento não encontrado.')
        }

        const ability = defineAbilityFor({
          id: user.id,
          role: user.role,
          unitId: user.unitId,
        } as any)

        if (
          ability.cannot(
            'update',
            {
              __typename: 'CashClosure',
              ...closure,
            } as any
          )
        ) {
          throw new UnauthorizedError(
            'You are not allowed to update this cash closure.'
          )
        }

        if (closure.status !== 'OPEN' && user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'FINANCIAL') {
          throw new UnauthorizedError(
            'Não é possível editar lançamentos já fechados.'
          )
        }

        const dateObj = new Date(cashDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (dateObj >= today) {
          throw new BadRequestError(
            'A data do caixa deve ser anterior à data de hoje.'
          )
        }

        const updated = await prisma.cashClosure.update({
          where: { id },
          data: {
            cashDate: dateObj,
            value,
            observation,
          },
          include: {
            unit: {
              select: {
                name: true,
              },
            },
          },
        })

        await logAction({
          userId,
          action: 'UPDATE',
          resource: 'CASH_CLOSURE',
          resourceId: id,
          details: `Editou fechamento de caixa do dia ${dateObj.toLocaleDateString('pt-BR')} no valor de R$ ${value.toFixed(2)} (Unidade: ${updated.unit?.name ?? ''})`,
        })

        return reply.status(204).send(null)
      }
    )
}
