import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function deleteEvaluation(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/evaluations/:id',
      {
        schema: {
          tags: ['evaluations'],
          summary: 'Delete an evaluation (Admin only)',
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

        if (ability.cannot('delete', 'Evaluation')) {
          throw new UnauthorizedError('Você não tem permissão para excluir avaliações.')
        }

        const { id } = request.params

        const evaluation = await prisma.evaluation.findUnique({
          where: { id },
        })

        if (!evaluation) {
          throw new BadRequestError('Avaliação não encontrada.')
        }

        await prisma.evaluation.delete({
          where: { id },
        })

        return reply.status(204).send()
      }
    )
}
