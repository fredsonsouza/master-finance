import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function updateUnit(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/units/:id',
      {
        schema: {
          tags: ['units'],
          summary: 'Update unit details',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.uuid(),
          }),
          body: z.object({
            name: z.string().min(1),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const targetUnitId = request.params.id

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

        if (ability.cannot('manage', 'Unit')) {
          throw new UnauthorizedError('You are not allowed to update units.')
        }

        const targetUnit = await prisma.unit.findUnique({
          where: { id: targetUnitId },
        })

        if (!targetUnit) {
          throw new BadRequestError('Unit not found.')
        }

        const { name } = request.body

        await prisma.unit.update({
          where: { id: targetUnitId },
          data: {
            name,
          },
        })

        return reply.status(204).send(null)
      }
    )
}
