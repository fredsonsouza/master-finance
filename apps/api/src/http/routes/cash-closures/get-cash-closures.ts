import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { type Permission, defineAbilityFor, hasPermission } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

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
            unitId: z.string().uuid().optional(),
            status: z.enum(['OPEN', 'CLOSED']).optional(),
            sectorId: z.string().uuid().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            search: z.string().optional(),
            page: z.coerce.number().int().min(1).default(1),
            perPage: z.coerce.number().int().min(1).max(500).default(20),
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
        const {
          unitId,
          status,
          sectorId,
          startDate,
          endDate,
          search,
          page,
          perPage,
        } = request.query

        const userId = await request.getCurrentUserId()
        const user = await prisma.user.findUnique({ where: { id: userId } })

        if (!user) {
          throw new UnauthorizedError()
        }

        const ability = defineAbilityFor({
          id: user.id,
          role: user.role,
          unitId: user.unitId,
          permissions: user.permissions as Permission[],
        })

        if (ability.cannot('get', 'CashClosure')) {
          throw new UnauthorizedError(
            'You are not allowed to view cash closures.'
          )
        }

        // Filtro base:
        const where: any = {}

        if (unitId) where.unitId = unitId
        if (status) where.status = status
        if (sectorId) where.sectorId = sectorId

        if (startDate || endDate) {
          where.cashDate = {}
          if (startDate) {
            where.cashDate.gte = new Date(startDate)
          }
          if (endDate) {
            const end = new Date(endDate)
            if (endDate.length === 10) {
              end.setUTCHours(23, 59, 59, 999)
            }
            where.cashDate.lte = end
          }
        }

        if (search && search.trim().length > 0) {
          where.user = {
            name: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          }
        }

        // Se não tiver escopo global de unidades, restringe à unidade vinculada ao usuário:
        if (!hasPermission(user, 'scope:all_units') && user.unitId) {
          where.unitId = user.unitId
        }

        const [totalCount, closures] = await Promise.all([
          prisma.cashClosure.count({ where }),
          prisma.cashClosure.findMany({
            where,
            take: perPage,
            skip: (page - 1) * perPage,
            include: {
              user: { select: { id: true, name: true } },
              sector: { select: { id: true, name: true } },
              unit: { select: { id: true, name: true } },
            },
            orderBy: { cashDate: 'desc' },
          }),
        ])

        const totalPages = Math.ceil(totalCount / perPage) || 1

        return reply.status(200).send({
          closures,
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
