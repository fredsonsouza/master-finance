import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getCollectionsReports(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/metrics/reports/collections',
      {
        schema: {
          tags: ['metrics', 'reports'],
          summary: 'Get collections report data',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            unitId: z.string().uuid().optional(),
            month: z.string().optional(),
          }),
          response: {
            200: z.object({
              monthlyHistory: z.array(
                z.object({
                  month: z.string(),
                  count: z.number(),
                })
              ),
              collectorRanking: z.array(
                z.object({
                  name: z.string(),
                  count: z.number(),
                })
              ),
              topExams: z.array(
                z.object({
                  name: z.string(),
                  count: z.number(),
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

        if (
          requestingUser.role !== 'MANAGER' &&
          requestingUser.role !== 'ADMIN' &&
          requestingUser.role !== 'FISCAL'
        ) {
          throw new UnauthorizedError()
        }

        const { unitId, month } = request.query

        const collections = await prisma.collection.findMany({
          where: { unitId },
          select: {
            requestDate: true,
            exams: true,
            collector: {
              select: {
                name: true,
              },
            },
          },
        })

        const monthlyMap = new Map<string, number>()
        const collectorsMap = new Map<string, number>()
        const examsMap = new Map<string, number>()

        for (const col of collections) {
          const dateStr = col.requestDate.toISOString()
          const colMonth = dateStr.slice(0, 7) // "YYYY-MM"

          // 1. Monthly History (Always calculated to show a timeline)
          monthlyMap.set(colMonth, (monthlyMap.get(colMonth) || 0) + 1)

          // 2. Filter by month if selected
          if (!month || colMonth === month) {
            // Collector Ranking
            const collectorName = col.collector.name
            collectorsMap.set(
              collectorName,
              (collectorsMap.get(collectorName) || 0) + 1
            )

            // Exams Count
            for (const exam of col.exams) {
              const cleanedExam = exam.trim().toUpperCase()
              if (cleanedExam) {
                examsMap.set(cleanedExam, (examsMap.get(cleanedExam) || 0) + 1)
              }
            }
          }
        }

        const monthlyHistory = Array.from(monthlyMap.entries())
          .map(([m, count]) => ({ month: m, count }))
          .sort((a, b) => a.month.localeCompare(b.month))

        const collectorRanking = Array.from(collectorsMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)

        const topExams = Array.from(examsMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15)

        return reply.status(200).send({
          monthlyHistory,
          collectorRanking,
          topExams,
        })
      }
    )
}
