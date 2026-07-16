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
          summary: 'Get all audit logs (ADMIN only)',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            resource: z.string().optional(),
            action: z.string().optional(),
            search: z.string().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
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

        const { resource, action, search, startDate, endDate } = request.query

        const whereClause: any = {}

        if (resource) {
          whereClause.resource = resource
        }

        if (action) {
          whereClause.action = action
        }

        if (search) {
          whereClause.OR = [
            { details: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { username: { contains: search, mode: 'insensitive' } } },
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

        const logs = await prisma.auditLog.findMany({
          where: whereClause,
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

        return reply.status(200).send({ logs })
      }
    )
}
