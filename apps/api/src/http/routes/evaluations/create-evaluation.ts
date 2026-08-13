import { prisma } from '@/lib/prisma'
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
          observation: z.string().optional().nullable(),
        }),
        response: {
          201: z.object({
            evaluationId: z.string().uuid(),
          }),
        },
      },
    },
    async (request, reply) => {
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
          observation: observation || null,
        },
      })

      return reply.status(201).send({ evaluationId: evaluation.id })
    }
  )
}
