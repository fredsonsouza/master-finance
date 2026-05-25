import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

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
            unitId: z.uuid(),
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

        const { name, unitId } = request.body

        const unit = await prisma.unit.findUnique({
          where: { id: unitId },
        })

        if (!unit) {
          throw new BadRequestError('Unit not found.')
        }

        const sector = await prisma.sector.create({
          data: {
            name,
            unitId,
          },
        })

        return reply.status(201).send({ sectorId: sector.id })
      }
    )
}
