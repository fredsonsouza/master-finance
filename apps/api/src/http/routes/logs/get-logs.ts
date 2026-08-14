import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getLogs(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/logs',
      {
        schema: {
          tags: ['logs'],
          summary: 'Get all audit logs with filters and pagination (ADMIN only)',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            resource: z.string().optional(),
            action: z.string().optional(),
            search: z.string().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            page: z.coerce.number().int().min(1).default(1),
            perPage: z.coerce.number().int().min(1).max(200).default(20),
          }),
          response: {
            200: z.object({
              logs: z.array(
                z.object({
                  id: z.string().uuid(),
                  action: z.string(),
                  resource: z.string(),
                  resourceId: z.string().uuid().nullable(),
                  details: z.string(),
                  createdAt: z.date(),
                  user: z.object({
                    id: z.string().uuid(),
                    name: z.string(),
                    username: z.string(),
                    role: z.string(),
                  }),
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

        if (requestingUser.role !== 'ADMIN') {
          throw new UnauthorizedError('Acesso restrito a administradores.')
        }

        const { resource, action, search, startDate, endDate, page, perPage } =
          request.query

        const whereClause: any = {}

        if (resource) {
          whereClause.resource = resource
        }

        if (action) {
          whereClause.action = action
        }

        if (search?.trim()) {
          whereClause.OR = [
            { details: { contains: search.trim(), mode: 'insensitive' } },
            { user: { name: { contains: search.trim(), mode: 'insensitive' } } },
            { user: { username: { contains: search.trim(), mode: 'insensitive' } } },
          ]
        }

        if (startDate || endDate) {
          whereClause.createdAt = {}
          if (startDate) {
            const start = new Date(startDate)
            start.setUTCHours(0, 0, 0, 0)
            whereClause.createdAt.gte = start
          }
          if (endDate) {
            const end = new Date(endDate)
            end.setUTCHours(23, 59, 59, 999)
            whereClause.createdAt.lte = end
          }
        }

        const totalCount = await prisma.auditLog.count({
          where: whereClause,
        })
        const totalPages = Math.ceil(totalCount / perPage) || 1

        const logs = await prisma.auditLog.findMany({
          where: whereClause,
          skip: (page - 1) * perPage,
          take: perPage,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return reply.status(200).send({
          logs,
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
