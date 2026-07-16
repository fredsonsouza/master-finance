import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

export async function getCashClosures(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/cash-closures',
      {
        schema: {
          tags: ['cash-closures'],
          summary: 'Get all cash closures',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            unitId: z.uuid().optional(),
            status: z.enum(['OPEN', 'CLOSED']).optional(),
            sectorId: z.uuid().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
          }),
          response: {
            200: z.object({
              closures: z.array(
                z.object({
                  id: z.uuid(),
                  cashDate: z.date(),
                  value: z.number(),
                  observation: z.string().nullable(),
                  status: z.enum(['OPEN', 'CLOSED']),
                  createdAt: z.date(),
                  user: z.object({
                    id: z.uuid(),
                    name: z.string(),
                  }),
                  sector: z
                    .object({
                      id: z.uuid(),
                      name: z.string(),
                    })
                    .nullable(),
                  unit: z.object({
                    id: z.uuid(),
                    name: z.string(),
                  }),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { unitId, status, sectorId, startDate, endDate } = request.query

        const userId = await request.getCurrentUserId()
        const user = await prisma.user.findUnique({ where: { id: userId } })

        // Filtro base:
        const where: any = {}

        if (unitId) where.unitId = unitId
        if (status) where.status = status
        if (sectorId) where.sectorId = sectorId

        if (startDate || endDate) {
          where.cashDate = {}
          if (startDate) where.cashDate.gte = new Date(startDate)
          if (endDate) where.cashDate.lte = new Date(endDate)
        }

        // Se for SELLER e não tiver global access, restringe mais:
        // Na real, a permissão diz que o SELLER vê todos do seu unitId.
        // A regra de negócio que pediu era: vê todos da sua unidade ou todos os seus?
        // Vamos deixar ele ver todos da sua unidade para transparência, como definido nas abilities.
        if (user?.role === 'SELLER' || user?.role === 'EMPLOYEE') {
          where.unitId = user.unitId // Força filtro na unidade do usuário
        }

        const closures = await prisma.cashClosure.findMany({
          where,
          include: {
            user: { select: { id: true, name: true } },
            sector: { select: { id: true, name: true } },
            unit: { select: { id: true, name: true } },
          },
          orderBy: { cashDate: 'desc' },
        })

        return reply.status(200).send({
          closures,
        })
      }
    )
}
