import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function deleteCollection(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/collections/:id',
      {
        schema: {
          tags: ['collections'],
          summary: 'Delete a collection',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { id } = request.params
        const userId = await request.getCurrentUserId()

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) throw new UnauthorizedError()

        const ability = defineAbilityFor({
          id: user.id,
          role: user.role,
          unitId: user.unitId,
        } as any)

        if (ability.cannot('delete', 'Collection')) {
          throw new UnauthorizedError(
            'You are not allowed to delete collections.'
          )
        }

        const collection = await prisma.collection.findUnique({
          where: { id },
          include: {
            unit: {
              select: {
                name: true,
              },
            },
          },
        })

        if (!collection) {
          throw new ResourceNotFoundError('Recoleta não encontrada.')
        }

        await prisma.collection.delete({
          where: { id },
        })

        await logAction({
          userId,
          action: 'DELETE',
          resource: 'COLLECTION',
          resourceId: id,
          details: `Excluiu recoleta do paciente ${collection.patientName} (Código: ${collection.patientCode}) na unidade ${collection.unit?.name ?? ''}`,
        })

        return reply.status(204).send(null)
      }
    )
}
