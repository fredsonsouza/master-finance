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

        // Check if category already exists (case insensitive)
        let category = await prisma.category.findFirst({
          where: {
            name: {
              equals: rawName,
              mode: 'insensitive',
            },
          },
        })

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: rawName,
            },
          })

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
