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

        // Check if category already exists
        if ((prisma as any).category) {
          try {
            category = await (prisma as any).category.findFirst({
              where: {
                name: {
                  equals: rawName,
                  mode: 'insensitive',
                },
              },
            })
          } catch {
            category = null
          }
        } else {
          try {
            const existing = await prisma.$queryRawUnsafe<any[]>(
              `SELECT * FROM "categories" WHERE LOWER("name") = LOWER($1) LIMIT 1;`,
              rawName
            )
            if (existing && existing.length > 0) {
              category = existing[0]
            }
          } catch {
            category = null
          }
        }

        if (!category) {
          if ((prisma as any).category) {
            try {
              category = await (prisma as any).category.create({
                data: {
                  name: rawName,
                },
              })
            } catch {
              // Ensure table exists and create via raw SQL
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

              const inserted = await prisma.$queryRawUnsafe<any[]>(
                `INSERT INTO "categories" ("id", "name", "createdAt", "updatedAt") 
                 VALUES (gen_random_uuid()::text, $1, NOW(), NOW()) 
                 ON CONFLICT ("name") DO UPDATE SET "updatedAt" = NOW() 
                 RETURNING "id", "name", "createdAt", "updatedAt";`,
                rawName
              )
              category = inserted[0]
            }
          } else {
            // Raw SQL fallback when prisma client was not regenerated
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

            const inserted = await prisma.$queryRawUnsafe<any[]>(
              `INSERT INTO "categories" ("id", "name", "createdAt", "updatedAt") 
               VALUES (gen_random_uuid()::text, $1, NOW(), NOW()) 
               ON CONFLICT ("name") DO UPDATE SET "updatedAt" = NOW() 
               RETURNING "id", "name", "createdAt", "updatedAt";`,
              rawName
            )
            category = inserted[0]
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
          category: {
            id: category.id,
            name: category.name,
            createdAt: new Date(category.createdAt),
            updatedAt: new Date(category.updatedAt),
          },
        })
      }
    )
}
