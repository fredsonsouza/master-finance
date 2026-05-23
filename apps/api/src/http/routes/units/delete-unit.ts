import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function deleteUnit(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/units/:id',
      {
        schema: {
          tags: ['units'],
          summary: 'Delete (deactivate) a unit',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.uuid(),
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
          throw new UnauthorizedError('You are not allowed to delete units.')
        }

        const targetUnit = await prisma.unit.findUnique({
          where: { id: targetUnitId },
        })

        if (!targetUnit) {
          throw new BadRequestError('Unit not found.')
        }

        // Hard deleting a unit will cascade delete its items and sectors.
        // If a soft-delete (isActive) is implemented in Prisma later, this route should be updated to just toggle the flag.
        await prisma.unit.delete({
          where: { id: targetUnitId },
        })

        return reply.status(204).send(null)
      }
    )
}
