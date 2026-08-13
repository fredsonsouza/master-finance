import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function updateEvaluation(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/evaluations/:id',
      {
        schema: {
          tags: ['evaluations'],
          summary: 'Update an evaluation (Admin only)',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            clientName: z.string().optional().nullable(),
            rating: z.enum(['EXCELLENT', 'GOOD', 'REGULAR', 'BAD']).optional(),
            presetComment: z.string().optional().nullable(),
            observation: z.string().optional().nullable(),
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

        if (ability.cannot('update', 'Evaluation')) {
          throw new UnauthorizedError('Você não tem permissão para editar avaliações.')
        }

        const { id } = request.params
        const { clientName, rating, presetComment, observation } = request.body

        const evaluation = await prisma.evaluation.findUnique({
          where: { id },
        })

        if (!evaluation) {
          throw new BadRequestError('Avaliação não encontrada.')
        }

        await prisma.evaluation.update({
          where: { id },
          data: {
            clientName: clientName !== undefined ? clientName : evaluation.clientName,
            rating: rating || evaluation.rating,
            presetComment: presetComment !== undefined ? presetComment : evaluation.presetComment,
            observation: observation !== undefined ? observation : evaluation.observation,
          },
        })

        return reply.status(204).send()
      }
    )
}
