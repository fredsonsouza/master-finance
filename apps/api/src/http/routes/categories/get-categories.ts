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
        try {
          categories = await prisma.category.findMany({
            orderBy: {
              name: 'asc',
            },
          })
        } catch (err) {
          try {
            await prisma.$executeRawUnsafe(`
              CREATE TABLE IF NOT EXISTS "categories" (
                "id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
              );
              CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");
              ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
            `)
            categories = await prisma.category.findMany({
              orderBy: {
                name: 'asc',
              },
            })
          } catch {
            categories = []
          }
        }

        return reply.status(200).send({ categories })
      }
    )
}
