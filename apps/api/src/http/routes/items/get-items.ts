import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getItems(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/items',
      {
        schema: {
          tags: ['items'],
          summary: 'Get all items with search, filtering and pagination',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            search: z.string().optional(),
            categoryId: z.string().uuid().optional(),
            sectorId: z.string().uuid().optional(),
            page: z.coerce.number().int().min(1).default(1),
            perPage: z.coerce.number().int().min(1).max(100).default(20),
          }),
          response: {
            200: z.object({
              items: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  description: z.string().nullable(),
                  quantity: z.number().int(),
                  categoryId: z.string().uuid().nullable().optional(),
                  sectorId: z.string().uuid().nullable().optional(),
                  createdAt: z.date(),
                  updatedAt: z.date(),
                  category: z
                    .object({
                      id: z.string().uuid(),
                      name: z.string(),
                    })
                    .nullable()
                    .optional(),
                  sector: z
                    .object({
                      id: z.string().uuid(),
                      name: z.string(),
                    })
                    .nullable()
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

        const { search, categoryId, sectorId, page, perPage } = request.query

        let items: any[] = []
        let totalCount = 0
        let totalPages = 1

        const where = {
          categoryId: categoryId || undefined,
          sectorId: sectorId || undefined,
          OR: search?.trim()
            ? [
                { name: { contains: search.trim(), mode: 'insensitive' as const } },
                { description: { contains: search.trim(), mode: 'insensitive' as const } },
              ]
            : undefined,
        }

        try {
          totalCount = await prisma.item.count({ where })
          totalPages = Math.ceil(totalCount / perPage) || 1

          items = await prisma.item.findMany({
            where,
            skip: (page - 1) * perPage,
            take: perPage,
            include: {
              category: true,
              sector: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        } catch (dbError) {
          // Fallback if category table/column is not yet migrated in database
          const fallbackWhere = {
            sectorId: sectorId || undefined,
            OR: search?.trim()
              ? [
                  { name: { contains: search.trim(), mode: 'insensitive' as const } },
                  { description: { contains: search.trim(), mode: 'insensitive' as const } },
                ]
              : undefined,
          }
          totalCount = await prisma.item.count({ where: fallbackWhere })
          totalPages = Math.ceil(totalCount / perPage) || 1

          const rawItems = await prisma.item.findMany({
            where: fallbackWhere,
            skip: (page - 1) * perPage,
            take: perPage,
            include: {
              sector: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          })

          items = rawItems.map((item) => ({
            ...item,
            categoryId: null,
            category: null,
          }))
        }

        return reply.status(200).send({
          items,
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
