import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function createItem(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/items',
      {
        schema: {
          tags: ['items'],
          summary: 'Create a new item',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string().min(1),
            description: z.string().nullable().optional(),
            unitId: z.uuid(),
            sectorId: z.uuid().nullable().optional(),
          }),
          response: {
            201: z.object({
              itemId: z.string(),
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

        const { name, description, unitId, sectorId } = request.body

        // Check if the user is authorized to create an item in the requested unit
        if (ability.cannot('create', { __typename: 'Item', unitId } as any)) {
          throw new UnauthorizedError(
            'You are not allowed to create an item in this unit.'
          )
        }

        const unit = await prisma.unit.findUnique({
          where: { id: unitId },
        })

        if (!unit) {
          throw new BadRequestError('Unit not found.')
        }

        if (sectorId) {
          const sector = await prisma.sector.findUnique({
            where: { id: sectorId },
          })
          if (!sector) {
            throw new BadRequestError('Sector not found.')
          }
          if (sector.unitId !== unitId) {
            throw new BadRequestError(
              'Sector does not belong to the specified unit.'
            )
          }
        }

        const item = await prisma.item.create({
          data: {
            name,
            description,
            unitId,
            sectorId,
          },
        })

        return reply.status(201).send({ itemId: item.id })
      }
    )
}
