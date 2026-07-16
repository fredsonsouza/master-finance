import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createSector(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/sectors',
      {
        schema: {
          tags: ['sectors'],
          summary: 'Create a new sector',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string().min(1),
          }),
          response: {
            201: z.object({
              sectorId: z.uuid(),
            }),
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

        if (ability.cannot('manage', 'Sector')) {
          throw new UnauthorizedError('You are not allowed to create a sector.')
        }

        const { name } = request.body

        const sector = await prisma.sector.create({
          data: {
            name,
          },
        })

        await logAction({
          userId,
          action: 'CREATE',
          resource: 'SECTOR',
          resourceId: sector.id,
          details: `Criou o setor ${name}`,
        })

        return reply.status(201).send({ sectorId: sector.id })
      }
    )
}
