import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getHrReports(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/hr-reports',
      {
        schema: {
          tags: ['hr-reports'],
          summary: 'List HR/Sector work reports',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            status: z.enum(['DRAFT', 'SENT']).optional(),
            unitId: z.string().uuid().optional(),
            sector: z.string().optional(),
            userId: z.string().uuid().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            search: z.string().optional(),
            page: z.coerce.number().int().min(1).default(1),
            perPage: z.coerce.number().int().min(1).max(100).default(20),
          }),
          response: {
            200: z.object({
              reports: z.array(
                z.object({
                  id: z.string().uuid(),
                  title: z.string(),
                  content: z.string(),
                  reportDate: z.date(),
                  status: z.enum(['DRAFT', 'SENT']),
                  sentAt: z.date().nullable(),
                  createdAt: z.date(),
                  updatedAt: z.date(),
                  user: z.object({
                    id: z.string().uuid(),
                    name: z.string(),
                    username: z.string(),
                    role: z.string(),
                  }),
                  unit: z
                    .object({
                      id: z.string().uuid(),
                      name: z.string(),
                    })
                    .nullable(),
                  sector: z.string().nullable(),
                })
              ),
              pagination: z.object({
                page: z.number(),
                perPage: z.number(),
                totalCount: z.number(),
                totalPages: z.number(),
              }),
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

        const canManageAllReports = ability.can('manage', 'HrReport')

        const {
          status,
          unitId,
          sector,
          userId: targetUserId,
          startDate,
          endDate,
          search,
          page,
          perPage,
        } = request.query

        const where: any = {}

        // Enforce user-scoped access for non-managers
        if (!canManageAllReports) {
          where.userId = requestingUser.id
        } else if (targetUserId) {
          where.userId = targetUserId
        }

        if (status) {
          where.status = status
        }

        if (unitId) {
          where.unitId = unitId
        }

        if (sector && sector.trim().length > 0) {
          where.sector = {
            contains: sector.trim(),
            mode: 'insensitive',
          }
        }

        if (startDate || endDate) {
          where.reportDate = {}
          if (startDate) {
            where.reportDate.gte = new Date(startDate)
          }
          if (endDate) {
            where.reportDate.lte = new Date(endDate)
          }
        }

        if (search && search.trim().length > 0) {
          where.OR = [
            {
              title: {
                contains: search.trim(),
                mode: 'insensitive',
              },
            },
            {
              content: {
                contains: search.trim(),
                mode: 'insensitive',
              },
            },
            {
              sector: {
                contains: search.trim(),
                mode: 'insensitive',
              },
            },
            {
              user: {
                name: {
                  contains: search.trim(),
                  mode: 'insensitive',
                },
              },
            },
          ]
        }

        const skip = (page - 1) * perPage

        const [totalCount, reports] = await Promise.all([
          prisma.hrReport.count({ where }),
          prisma.hrReport.findMany({
            where,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  role: true,
                },
              },
              unit: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: [{ reportDate: 'desc' }, { createdAt: 'desc' }],
            skip,
            take: perPage,
          }),
        ])

        const totalPages = Math.ceil(totalCount / perPage) || 1

        return reply.status(200).send({
          reports: reports.map((r) => ({
            id: r.id,
            title: r.title,
            content: r.content,
            reportDate: r.reportDate,
            status: r.status,
            sentAt: r.sentAt,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            user: {
              id: r.user.id,
              name: r.user.name,
              username: r.user.username,
              role: r.user.role,
            },
            unit: r.unit
              ? {
                  id: r.unit.id,
                  name: r.unit.name,
                }
              : null,
            sector: r.sector,
          })),
          pagination: {
            page,
            perPage,
            totalCount,
            totalPages,
          },
        })
      }
    )
}
