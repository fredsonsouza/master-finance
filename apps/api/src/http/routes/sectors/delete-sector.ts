import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function deleteSector(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/sectors/:id',
      {
        schema: {
          tags: ['sectors'],
          summary: 'Delete a sector',
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
          throw new UnauthorizedError('You are not allowed to delete sectors.')
        }

        const targetSector = await prisma.sector.findUnique({
          where: { id: targetSectorId },
        })

        if (!targetSector) {
          throw new BadRequestError('Sector not found.')
        }

        await prisma.sector.delete({
          where: { id: targetSectorId },
        })

        await logAction({
          userId,
          action: 'DELETE',
          resource: 'SECTOR',
          resourceId: targetSectorId,
          details: `Excluiu o setor ${targetSector.name}`,
        })

        return reply.status(204).send(null)
      }
    )
}
