import { prisma } from '@/lib/prisma'
import { hasAnyPermission } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'

export async function getPublicSeller(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/evaluations/public/seller/:sellerId',
    {
      schema: {
        tags: ['evaluations'],
        summary: 'Get public seller info for evaluation page (Public)',
        params: z.object({
          sellerId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            seller: z.object({
              id: z.string().uuid(),
              name: z.string(),
              avatarUrl: z.string().nullable(),
              unit: z
                .object({
                  id: z.string().uuid(),
                  name: z.string(),
                })
                .nullable(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { sellerId } = request.params

      const seller = await prisma.user.findUnique({
        where: { id: sellerId },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true,
          permissions: true,
          unit: {
            select: {
              id: true,
              name: true,
            },
          },
          employee: {
            select: {
              status: true,
              department: {
                select: {
                  type: true,
                },
              },
            },
          },
        },
      })

      const isEligibleSeller =
        seller &&
        seller.employee?.status !== 'INACTIVE' &&
        (seller.role === 'ADMIN' ||
          hasAnyPermission(seller, [
            'evaluations:receive',
            'evaluations:manage',
          ]) ||
          seller.employee?.department?.type === 'RECEPTION')

      if (!isEligibleSeller) {
        throw new BadRequestError('Recepcionista não encontrada.')
      }

      return reply.status(200).send({
        seller: {
          id: seller.id,
          name: seller.name,
          avatarUrl: seller.avatarUrl,
          unit: seller.unit,
        },
      })
    }
  )
}
