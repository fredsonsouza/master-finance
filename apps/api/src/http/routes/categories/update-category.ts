import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function updateCategory(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/categories/:id',
      {
        schema: {
          tags: ['categories'],
          summary: 'Update an item category (ADMIN, MANAGER, INVENTORY)',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            name: z.string().min(1, 'Nome da categoria é obrigatório.'),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { id } = request.params
        const { name } = request.body

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

        if (ability.cannot('update', 'Category')) {
          throw new UnauthorizedError(
            'Você não tem permissão para editar categorias.'
          )
        }

        const category = await prisma.category.findUnique({
          where: { id },
        })

        if (!category) {
          throw new ResourceNotFoundError('Categoria não encontrada.')
        }

        const rawName = name.trim()

        const existingCategoryWithSameName = await prisma.category.findFirst({
          where: {
            name: {
              equals: rawName,
              mode: 'insensitive',
            },
            id: {
              not: id,
            },
          },
        })

        if (existingCategoryWithSameName) {
          throw new BadRequestError('Já existe uma categoria com este nome.')
        }

        const updatedCategory = await prisma.category.update({
          where: { id },
          data: {
            name: rawName,
          },
        })

        await logAction({
          userId,
          action: 'UPDATE',
          resource: 'ITEM',
          resourceId: category.id,
          details: `Editou a categoria de itens de "${category.name}" para "${updatedCategory.name}"`,
        })

        return reply.status(204).send(null)
      }
    )
}
