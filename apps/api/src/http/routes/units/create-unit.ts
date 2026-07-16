import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createUnit(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/units',
      {
        schema: {
          tags: ['units'],
          summary: 'Create a new unit',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string().min(1),
          }),
          response: {
            201: z.object({
              unitId: z.uuid(),
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

        if (ability.cannot('manage', 'Unit')) {
          throw new UnauthorizedError('You are not allowed to create a unit.')
        }

        const { name } = request.body

        const unit = await prisma.unit.create({
          data: {
            name,
          },
        })

        await logAction({
          userId,
          action: 'CREATE',
          resource: 'UNIT',
          resourceId: unit.id,
          details: `Criou a unidade: ${name}`,
        })

        return reply.status(201).send({ unitId: unit.id })
      }
    )
}
