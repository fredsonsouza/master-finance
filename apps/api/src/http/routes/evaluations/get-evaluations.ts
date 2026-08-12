import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getEvaluations(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/evaluations',
      {
        schema: {
          tags: ['evaluations'],
          summary: 'Get evaluations and metrics for sellers',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            sellerId: z.string().uuid().optional(),
            unitId: z.string().uuid().optional(),
          }),
          response: {
            200: z.object({
              evaluations: z.array(
                z.object({
                  id: z.string().uuid(),
                  rating: z.enum(['EXCELLENT', 'GOOD', 'REGULAR', 'BAD']),
                  presetComment: z.string().nullable(),
                  observation: z.string().nullable(),
                  createdAt: z.date(),
                  sellerId: z.string().uuid(),
                  seller: z.object({
                    id: z.string().uuid(),
                    name: z.string(),
                    avatarUrl: z.string().nullable(),
                  }),
                  unit: z
                    .object({
                      id: z.string().uuid(),
                      name: z.string(),
                    })
                    .nullable(),
                })
              ),
              metrics: z.object({
                total: z.number(),
                excellentCount: z.number(),
                goodCount: z.number(),
                regularCount: z.number(),
                badCount: z.number(),
                satisfactionRate: z.number(),
              }),
              podium: z.array(
                z.object({
                  position: z.number(),
                  sellerId: z.string().uuid(),
                  sellerName: z.string(),
                  sellerAvatarUrl: z.string().nullable(),
                  unitId: z.string().uuid().nullable(),
                  unitName: z.string().nullable(),
                  totalEvaluations: z.number(),
                  excellentCount: z.number(),
                  goodCount: z.number(),
                  satisfactionRate: z.number(),
                  score: z.number(),
                })
              ),
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

        if (ability.cannot('get', 'Evaluation')) {
          throw new UnauthorizedError('Você não tem permissão para ver avaliações.')
        }

        let { sellerId, unitId } = request.query

        // If SELLER role, force filtering by own sellerId
        if (requestingUser.role === 'SELLER') {
          sellerId = requestingUser.id
        }

        const evaluations = await prisma.evaluation.findMany({
          where: {
            sellerId: sellerId || undefined,
            unitId: unitId || undefined,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            rating: true,
            presetComment: true,
            observation: true,
            createdAt: true,
            sellerId: true,
            seller: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            unit: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        const total = evaluations.length
        let excellentCount = 0
        let goodCount = 0
        let regularCount = 0
        let badCount = 0

        const sellerMap = new Map<
          string,
          {
            sellerId: string
            sellerName: string
            sellerAvatarUrl: string | null
            unitId: string | null
            unitName: string | null
            totalEvaluations: number
            excellentCount: number
            goodCount: number
            regularCount: number
            badCount: number
          }
        >()

        for (const ev of evaluations) {
          if (ev.rating === 'EXCELLENT') excellentCount++
          else if (ev.rating === 'GOOD') goodCount++
          else if (ev.rating === 'REGULAR') regularCount++
          else if (ev.rating === 'BAD') badCount++

          let sellerData = sellerMap.get(ev.sellerId)
          if (!sellerData) {
            sellerData = {
              sellerId: ev.sellerId,
              sellerName: ev.seller.name,
              sellerAvatarUrl: ev.seller.avatarUrl,
              unitId: ev.unit?.id || null,
              unitName: ev.unit?.name || null,
              totalEvaluations: 0,
              excellentCount: 0,
              goodCount: 0,
              regularCount: 0,
              badCount: 0,
            }
            sellerMap.set(ev.sellerId, sellerData)
          }

          sellerData.totalEvaluations++
          if (ev.rating === 'EXCELLENT') sellerData.excellentCount++
          else if (ev.rating === 'GOOD') sellerData.goodCount++
          else if (ev.rating === 'REGULAR') sellerData.regularCount++
          else if (ev.rating === 'BAD') sellerData.badCount++
        }

        const positiveCount = excellentCount + goodCount
        const satisfactionRate = total > 0 ? Math.round((positiveCount / total) * 100) : 0

        const sellerStats = Array.from(sellerMap.values()).map((s) => {
          const positive = s.excellentCount + s.goodCount
          const sRate = s.totalEvaluations > 0 ? Math.round((positive / s.totalEvaluations) * 100) : 0
          const score = s.excellentCount * 3 + s.goodCount * 2 + s.regularCount * 1

          return {
            ...s,
            satisfactionRate: sRate,
            score,
          }
        })

        sellerStats.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          if (b.satisfactionRate !== a.satisfactionRate) return b.satisfactionRate - a.satisfactionRate
          return b.totalEvaluations - a.totalEvaluations
        })

        const podium = sellerStats.slice(0, 3).map((seller, index) => ({
          position: index + 1,
          sellerId: seller.sellerId,
          sellerName: seller.sellerName,
          sellerAvatarUrl: seller.sellerAvatarUrl,
          unitId: seller.unitId,
          unitName: seller.unitName,
          totalEvaluations: seller.totalEvaluations,
          excellentCount: seller.excellentCount,
          goodCount: seller.goodCount,
          satisfactionRate: seller.satisfactionRate,
          score: seller.score,
        }))

        return reply.status(200).send({
          evaluations,
          metrics: {
            total,
            excellentCount,
            goodCount,
            regularCount,
            badCount,
            satisfactionRate,
          },
          podium,
        })
      }
    )
}
