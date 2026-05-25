import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function updateSector(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/sectors/:id',
      {
        schema: {
          tags: ['sectors'],
          summary: 'Update sector details',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            name: z.string().min(1).optional(),
            unitId: z.uuid().optional(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const targetSectorId = request.params.id

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

        if (ability.cannot('manage', 'Sector')) {
          throw new UnauthorizedError('You are not allowed to update sectors.')
        }

        const targetSector = await prisma.sector.findUnique({
          where: { id: targetSectorId },
        })

        if (!targetSector) {
          throw new BadRequestError('Sector not found.')
        }

        const { name, unitId } = request.body

        if (unitId) {
          const unit = await prisma.unit.findUnique({ where: { id: unitId } })
          if (!unit) {
            throw new BadRequestError('Unit not found.')
          }
        }

        await prisma.sector.update({
          where: { id: targetSectorId },
          data: {
            name: name ?? targetSector.name,
            unitId: unitId ?? targetSector.unitId,
          },
        })

        return reply.status(204).send(null)
      }
    )
}
