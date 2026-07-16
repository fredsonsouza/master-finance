import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
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

        const closure = await prisma.cashClosure.findUnique({
          where: { id },
        })

        if (!closure) {
          return reply
            .status(404)
            .send({ message: 'Lançamento não encontrado.' } as any)
        }

        // Validação de regras de negócio
        if (user?.role === 'SELLER' || user?.role === 'EMPLOYEE') {
          // Só pode editar o próprio lançamento
          if (closure.userId !== userId) {
            throw new UnauthorizedError()
          }
          // Só pode editar se estiver OPEN
          if (closure.status !== 'OPEN') {
            return reply.status(403).send({
              message: 'Não é possível editar lançamentos já fechados.',
            } as any)
          }
        }

        const dateObj = new Date(cashDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (dateObj >= today) {
          return reply.status(400).send({
            message: 'A data do caixa deve ser anterior à data de hoje.',
          } as any)
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

        return reply.status(204).send()
      }
    )
}
