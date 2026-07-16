import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getCollections(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/collections',
      {
        schema: {
          tags: ['collections'],
          summary: 'Get all collections',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            unitId: z.string().uuid().optional(),
          }),
          response: {
            200: z.object({
              collections: z.any(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { unitId } = request.query
        const userId = await request.getCurrentUserId()

        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
        })
        if (!currentUser) throw new UnauthorizedError()

        const ability = defineAbilityFor({
          id: currentUser.id,
          role: currentUser.role,
          unitId: currentUser.unitId,
        } as any)

        if (ability.cannot('get', 'Collection')) {
          throw new UnauthorizedError(
            'You are not allowed to view collections.'
          )
        }

        const where: any = {}
        if (unitId) where.unitId = unitId

        if (currentUser.role === 'COLLECTOR') {
          where.unitId = currentUser.unitId
        }

        const collections = await prisma.collection.findMany({
          where,
          include: {
            collector: { select: { id: true, name: true } },
            unit: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
          },
          orderBy: { requestDate: 'desc' },
        })

        return reply.send({ collections })
      }
    )
}
