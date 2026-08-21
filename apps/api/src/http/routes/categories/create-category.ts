import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createCategory(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/categories',
      {
        schema: {
          tags: ['categories'],
          summary: 'Create a new item category',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string().min(1, 'Nome da categoria é obrigatório.'),
          }),
          response: {
            201: z.object({
              categoryId: z.string().uuid(),
              category: z.object({
                id: z.string().uuid(),
                name: z.string(),
                createdAt: z.date(),
                updatedAt: z.date(),
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

        if (ability.cannot('create', 'Category')) {
          throw new UnauthorizedError(
            'Você não tem permissão para criar uma categoria.'
          )
        }

        const rawName = request.body.name.trim()

        let category: any = null

        // Check if category already exists (case insensitive)
        try {
          category = await prisma.category.findFirst({
            where: {
              name: {
                equals: rawName,
                mode: 'insensitive',
              },
            },
          })
        } catch (err) {
          // If table does not exist in DB, auto-create it
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
          } catch {}
          category = null
        }

        if (!category) {
          try {
            category = await prisma.category.create({
              data: {
                name: rawName,
              },
            })
          } catch (createErr) {
            // Ensure table exists and retry
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
            category = await prisma.category.create({
              data: {
                name: rawName,
              },
            })
          }

          await logAction({
            userId,
            action: 'CREATE',
            resource: 'ITEM',
            resourceId: category.id,
            details: `Criou a categoria de itens ${category.name}`,
          })
        }

        return reply.status(201).send({
          categoryId: category.id,
          category,
        })
      }
    )
}
