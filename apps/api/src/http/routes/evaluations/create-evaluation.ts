import { prisma } from '@/lib/prisma'
import { checkEvaluationAvailability } from '@/utils/evaluation-schedule'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'

export async function createEvaluation(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/evaluations/public',
    {
      schema: {
        tags: ['evaluations'],
        summary: 'Submit customer evaluation for a seller/receptionist (Public)',
        body: z.object({
          sellerId: z.string().uuid(),
          clientName: z.string().min(2, 'O nome do cliente é obrigatório.'),
          rating: z.enum(['EXCELLENT', 'GOOD', 'REGULAR', 'BAD']),
          presetComment: z.string().optional().nullable(),
          observation: z.string().min(1, 'O comentário sobre o atendimento é obrigatório.'),
        }),
        response: {
          201: z.object({
            evaluationId: z.string().uuid(),
          }),
        },
      },
    },
    async (request, reply) => {
      // Validação de horário de funcionamento no fuso de Roraima (GMT-4)
      const availability = checkEvaluationAvailability()
      if (!availability.isOpen) {
        throw new BadRequestError(
          availability.message ||
            'O período de avaliações está encerrado no momento. As avaliações ocorrem de segunda a sexta das 06h às 18h20 e aos sábados das 06h às 12h20 (Horário de Roraima).'
        )
      }

      const { sellerId, clientName, rating, presetComment, observation } = request.body

      const seller = await prisma.user.findUnique({
        where: { id: sellerId },
      })

      if (!seller || !['SELLER', 'ADMIN', 'MANAGER'].includes(seller.role)) {
        throw new BadRequestError('Recepcionista não encontrada.')
      }

      const evaluation = await prisma.evaluation.create({
        data: {
          sellerId,
          unitId: seller.unitId,
          clientName: clientName.trim(),
          rating,
          presetComment: presetComment || null,
          observation: observation.trim(),
        },
      })

      return reply.status(201).send({ evaluationId: evaluation.id })
    }
  )
}
