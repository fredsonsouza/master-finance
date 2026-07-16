import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function deleteCashClosure(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/cash-closures/:id',
      {
        schema: {
          tags: ['cash-closures'],
          summary: 'Delete a cash closure',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.uuid(),
          }),
          response: {
            204: z.null(),
            404: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { id } = request.params

        const userId = await request.getCurrentUserId()
        const user = await prisma.user.findUnique({ where: { id: userId } })

        if (user?.role === 'SELLER' || user?.role === 'EMPLOYEE') {
          throw new UnauthorizedError()
        }

        const closure = await prisma.cashClosure.findUnique({
          where: { id },
          include: {
            unit: {
              select: {
                name: true,
              },
            },
          },
        })

        if (!closure) {
          return reply
            .status(404)
            .send({ message: 'Lançamento não encontrado.' } as any)
        }

        await prisma.cashClosure.delete({
          where: { id },
        })

        await logAction({
          userId,
          action: 'DELETE',
          resource: 'CASH_CLOSURE',
          resourceId: id,
          details: `Excluiu fechamento de caixa do dia ${closure.cashDate.toLocaleDateString('pt-BR')} no valor de R$ ${closure.value.toFixed(2)} (Unidade: ${closure.unit?.name ?? ''})`,
        })

        return reply.status(204).send()
      }
    )
}
