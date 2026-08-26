import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function changeCashClosureStatus(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/cash-closures/:id/status',
      {
        schema: {
          tags: ['cash-closures'],
          summary: 'Change cash closure status',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            status: z.enum(['OPEN', 'CLOSED']),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { id } = request.params
        const { status } = request.body

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

        const updated = await prisma.cashClosure.update({
          where: { id },
          data: {
            status,
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
          details: `Alterou status do fechamento de caixa do dia ${updated.cashDate.toLocaleDateString('pt-BR')} (Unidade: ${updated.unit?.name ?? ''}) para: ${status === 'CLOSED' ? 'FECHADO' : 'ABERTO'}`,
        })

        return reply.status(204).send(null)
      }
    )
}
