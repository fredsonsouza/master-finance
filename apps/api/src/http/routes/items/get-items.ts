import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getItems(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/items',
      {
        schema: {
          tags: ['items'],
          summary: 'Get all items',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            unitId: z.uuid().optional(),
            sectorId: z.uuid().optional(),
          }),
          response: {
            200: z.object({
              items: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  description: z.string().nullable(),
                  unitId: z.string().uuid(),
                  sectorId: z.string().uuid().nullable(),
                  createdAt: z.date(),
                  updatedAt: z.date(),
                })
              ),
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

        let { unitId, sectorId } = request.query

        // Enforce employee restrictions
        if (requestingUser.role === 'EMPLOYEE') {
          if (!requestingUser.unitId) {
            return reply.status(200).send({ items: [] }) // Employee with no unit sees no items
          }
          unitId = requestingUser.unitId
        } else {
          // For MANAGER/ADMIN, if they didn't provide unitId, we must verify if they can read globally
          // Actually MANAGER can read globally. We don't need to force unitId.
        }

        const items = await prisma.item.findMany({
          where: {
            unitId,
            sectorId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return reply.status(200).send({ items })
      }
    )
}
