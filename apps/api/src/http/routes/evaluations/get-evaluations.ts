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
          summary: 'Get evaluations, metrics, and podium for sellers with date filters and monthly podium',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            sellerId: z.string().uuid().optional(),
            unitId: z.string().uuid().optional(),
            podiumUnitId: z.string().uuid().optional(),
            podiumMonth: z.string().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            page: z.coerce.number().int().min(1).default(1),
            perPage: z.coerce.number().int().min(1).max(500).default(10),
          }),
          response: {
            200: z.object({
              evaluations: z.array(
                z.object({
                  id: z.string().uuid(),
                  clientName: z.string().nullable(),
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
              pagination: z.object({
                page: z.number(),
                perPage: z.number(),
                totalCount: z.number(),
                totalPages: z.number(),
              }),
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

        let {
          sellerId,
          unitId,
          podiumUnitId,
          podiumMonth,
          startDate,
          endDate,
          page,
          perPage,
        } = request.query

        // If SELLER role, force filtering by own sellerId
        if (requestingUser.role === 'SELLER') {
          sellerId = requestingUser.id
        }

        const where: any = {
          sellerId: sellerId || undefined,
          unitId: unitId || undefined,
        }

        if (startDate || endDate) {
          where.createdAt = {}
          if (startDate) {
            const start = new Date(startDate)
            start.setUTCHours(0, 0, 0, 0)
            where.createdAt.gte = start
          }
          if (endDate) {
            const end = new Date(endDate)
            end.setUTCHours(23, 59, 59, 999)
            where.createdAt.lte = end
          }
        }

        // 1. Total count for pagination
        const totalCount = await prisma.evaluation.count({ where })
        const totalPages = Math.ceil(totalCount / perPage) || 1

        // 2. Fetch paginated evaluations
        const evaluations = await prisma.evaluation.findMany({
          where,
          skip: (page - 1) * perPage,
          take: perPage,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            clientName: true,
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

        // 3. Fast SQL aggregate for metrics distribution
        const ratingGroups = await prisma.evaluation.groupBy({
          by: ['rating'],
          where,
          _count: {
            rating: true,
          },
        })

        let excellentCount = 0
        let goodCount = 0
        let regularCount = 0
        let badCount = 0

        for (const g of ratingGroups) {
          if (g.rating === 'EXCELLENT') excellentCount = g._count.rating
          else if (g.rating === 'GOOD') goodCount = g._count.rating
          else if (g.rating === 'REGULAR') regularCount = g._count.rating
          else if (g.rating === 'BAD') badCount = g._count.rating
        }

        const positiveCount = excellentCount + goodCount
        const satisfactionRate = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 0

        // 4. Podium calculation - Filtered by unit & specific month (defaults to current month if passed)
        const targetPodiumUnitId = podiumUnitId || (unitId ? unitId : undefined)
        let podium: Array<{
          position: number
          sellerId: string
          sellerName: string
          sellerAvatarUrl: string | null
          unitId: string | null
          unitName: string | null
          totalEvaluations: number
          excellentCount: number
          goodCount: number
          satisfactionRate: number
          score: number
        }> = []

        if (targetPodiumUnitId) {
          let podiumCreatedAtFilter: any = undefined
          if (podiumMonth) {
            const [yearStr, monthStr] = podiumMonth.split('-')
            const year = parseInt(yearStr, 10)
            const month = parseInt(monthStr, 10) - 1
            if (!isNaN(year) && !isNaN(month)) {
              const startMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
              const endMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))
              podiumCreatedAtFilter = {
                gte: startMonth,
                lte: endMonth,
              }
            }
          }

          const sellerRatingGroups = await prisma.evaluation.groupBy({
            by: ['sellerId', 'rating'],
            where: {
              unitId: targetPodiumUnitId,
              ...(podiumCreatedAtFilter ? { createdAt: podiumCreatedAtFilter } : {}),
            },
            _count: {
              rating: true,
            },
          })

          const sellerIds = Array.from(new Set(sellerRatingGroups.map((g) => g.sellerId)))

          if (sellerIds.length > 0) {
            const sellersInfo = await prisma.user.findMany({
              where: {
                id: { in: sellerIds },
              },
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                unit: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            })

            const sellerInfoMap = new Map(sellersInfo.map((s) => [s.id, s]))

            const sellerStatsMap = new Map<
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

            for (const g of sellerRatingGroups) {
              const info = sellerInfoMap.get(g.sellerId)
              if (!info) continue

              let stat = sellerStatsMap.get(g.sellerId)
              if (!stat) {
                stat = {
                  sellerId: info.id,
                  sellerName: info.name,
                  sellerAvatarUrl: info.avatarUrl,
                  unitId: info.unit?.id || null,
                  unitName: info.unit?.name || null,
                  totalEvaluations: 0,
                  excellentCount: 0,
                  goodCount: 0,
                  regularCount: 0,
                  badCount: 0,
                }
                sellerStatsMap.set(g.sellerId, stat)
              }

              const count = g._count.rating
              stat.totalEvaluations += count
              if (g.rating === 'EXCELLENT') stat.excellentCount += count
              else if (g.rating === 'GOOD') stat.goodCount += count
              else if (g.rating === 'REGULAR') stat.regularCount += count
              else if (g.rating === 'BAD') stat.badCount += count
            }

            const sellerStats = Array.from(sellerStatsMap.values()).map((s) => {
              const positive = s.excellentCount + s.goodCount
              const sRate = s.totalEvaluations > 0 ? Math.round((positive / s.totalEvaluations) * 100) : 0

              return {
                ...s,
                satisfactionRate: sRate,
                score: 0,
              }
            })

            sellerStats.sort((a, b) => {
              if (b.totalEvaluations !== a.totalEvaluations) return b.totalEvaluations - a.totalEvaluations
              if (b.satisfactionRate !== a.satisfactionRate) return b.satisfactionRate - a.satisfactionRate
              return b.excellentCount - a.excellentCount
            })

            podium = sellerStats.slice(0, 3).map((seller, index) => ({
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
          }
        }

        return reply.status(200).send({
          evaluations,
          pagination: {
            page,
            perPage,
            totalCount,
            totalPages,
          },
          metrics: {
            total: totalCount,
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
