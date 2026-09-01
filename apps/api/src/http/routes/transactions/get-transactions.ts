import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getTransactions(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/transactions',
      {
        schema: {
          tags: ['transactions'],
          summary: 'Get all transactions with pagination and filtering',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            unitId: z.string().uuid().optional(),
            itemId: z.string().uuid().optional(),
            month: z.string().optional(),
            type: z.enum(['ENTRY', 'EXIT']).optional(),
            search: z.string().optional(),
            page: z.coerce.number().int().min(1).default(1),
            perPage: z.coerce.number().int().min(1).max(200).default(20),
          }),
          response: {
            200: z.object({
              transactions: z.array(
                z.object({
                  id: z.uuid(),
                  type: z.enum(['ENTRY', 'EXIT']),
                  date: z.date(),
                  value: z.number(),
                  quantity: z.number(),
                  month: z.string(),
                  batchId: z.uuid().nullable(),
                  item: z.object({
                    id: z.uuid(),
                    name: z.string(),
                    description: z.string().nullable(),
                    sector: z
                      .object({
                        name: z.string(),
                      })
                      .nullable()
                      .optional(),
                  }),
                  sector: z
                    .object({
                      id: z.uuid(),
                      name: z.string(),
                    })
                    .nullable()
                    .optional(),
                  unit: z
                    .object({
                      name: z.string(),
                    })
                    .optional(),
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

        if (ability.cannot('get', 'Transaction')) {
          throw new UnauthorizedError(
            'You are not allowed to view transactions.'
          )
        }

        let { unitId, itemId, month, type, search, page, perPage } = request.query

        if (
          requestingUser.role === 'EMPLOYEE' ||
          requestingUser.role === 'SELLER'
        ) {
          if (!requestingUser.unitId) {
            return reply.status(200).send({
              transactions: [],
              pagination: {
                page,
                perPage,
                totalCount: 0,
                totalPages: 1,
              },
            })
          }
          unitId = requestingUser.unitId
        }

        const where: any = {
          unitId: unitId || undefined,
          itemId: itemId || undefined,
          month: month || undefined,
          type: type || undefined,
        }

        if (search && search.trim().length > 0) {
          const searchTerm = search.trim()
          where.OR = [
            { item: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { item: { description: { contains: searchTerm, mode: 'insensitive' } } },
            { sector: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { unit: { name: { contains: searchTerm, mode: 'insensitive' } } },
          ]
        }

        const [totalCount, transactions] = await Promise.all([
          prisma.transaction.count({ where }),
          prisma.transaction.findMany({
            where,
            take: perPage,
            skip: (page - 1) * perPage,
            include: {
              unit: {
                select: { name: true },
              },
              sector: {
                select: { id: true, name: true },
              },
              item: {
                include: {
                  sector: true,
                },
              },
            },
            orderBy: {
              date: 'desc',
            },
          }),
        ])

        const totalPages = Math.ceil(totalCount / perPage) || 1

        return reply.status(200).send({
          transactions,
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
