import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getCategories(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/categories',
      {
        schema: {
          tags: ['categories'],
          summary: 'Get all item categories',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              categories: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  createdAt: z.date(),
                  updatedAt: z.date(),
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

        let categories: any[] = []

        if ((prisma as any).category) {
          try {
            categories = await (prisma as any).category.findMany({
              orderBy: {
                name: 'asc',
              },
            })
          } catch {
            categories = []
          }
        }

        if (categories.length === 0) {
          try {
            categories = await prisma.$queryRawUnsafe<any[]>(
              `SELECT "id", "name", "createdAt", "updatedAt" FROM "categories" ORDER BY "name" ASC;`
            )
          } catch {
            categories = []
          }
        }

        return reply.status(200).send({
          categories: categories.map((c) => ({
            id: c.id,
            name: c.name,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          })),
        })
      }
    )
}
