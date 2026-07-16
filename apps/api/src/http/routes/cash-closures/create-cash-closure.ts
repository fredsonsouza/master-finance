import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createCashClosure(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/cash-closures',
      {
        schema: {
          tags: ['cash-closures'],
          summary: 'Create a new cash closure',
          security: [{ bearerAuth: [] }],
          body: z.object({
            cashDate: z.string().datetime(),
            value: z.number(),
            observation: z.string().optional(),
            unitId: z.string().uuid(),
            sectorId: z.string().uuid().optional(),
            userId: z.string().uuid().optional(),
          }),
          response: {
            201: z.object({
              closureId: z.string().uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const {
          cashDate,
          value,
          observation,
          unitId,
          sectorId,
          userId: targetUserId,
        } = request.body

        const currentUserId = await request.getCurrentUserId()
        const user = await prisma.user.findUnique({
          where: { id: currentUserId },
        })

        if (!user) {
          throw new UnauthorizedError()
        }

        const dateObj = new Date(cashDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Start of today

        if (dateObj >= today) {
          return reply.status(201).send({
            message: 'A data do caixa deve ser anterior à data de hoje.',
          } as any)
        }

        const finalUserId =
          (user.role === 'FINANCIAL' ||
            user.role === 'MANAGER' ||
            user.role === 'ADMIN') &&
          targetUserId
            ? targetUserId
            : currentUserId

        const closure = await prisma.cashClosure.create({
          data: {
            cashDate: dateObj,
            value,
            observation,
            userId: finalUserId,
            unitId,
            sectorId,
            status: 'OPEN',
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
          userId: currentUserId,
          action: 'CREATE',
          resource: 'CASH_CLOSURE',
          resourceId: closure.id,
          details: `Criou fechamento de caixa para a data ${dateObj.toLocaleDateString('pt-BR')} no valor de R$ ${value.toFixed(2)} (Unidade: ${closure.unit?.name ?? ''})`,
        })

        return reply.status(201).send({
          closureId: closure.id,
        })
      }
    )
}
