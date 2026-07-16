import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createCollection(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/collections',
      {
        schema: {
          tags: ['collections'],
          summary: 'Create a new collection',
          security: [{ bearerAuth: [] }],
          body: z.object({
            requestDate: z.string().datetime(),
            patientCode: z.string(),
            patientName: z.string(),
            exams: z.array(z.string()),
            reason: z.string().max(120),
            collectorId: z.string().uuid(),
            pendingBy: z.string(),
            notifiedBy: z.string(),
            unitId: z.string().uuid(),
          }),
          response: {
            201: z.object({
              collectionId: z.string().uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const {
          requestDate,
          patientCode,
          patientName,
          exams,
          reason,
          collectorId,
          pendingBy,
          notifiedBy,
          unitId,
        } = request.body

        const userId = await request.getCurrentUserId()
        const user = await prisma.user.findUnique({ where: { id: userId } })

        if (!user) {
          throw new UnauthorizedError()
        }

        const ability = defineAbilityFor({
          id: user.id,
          role: user.role,
          unitId: user.unitId,
        } as any)

        if (ability.cannot('create', 'Collection')) {
          throw new UnauthorizedError(
            'You are not allowed to create collections.'
          )
        }

        const dateObj = new Date(requestDate)

        const collection = await prisma.collection.create({
          data: {
            requestDate: dateObj,
            patientCode,
            patientName,
            exams,
            reason,
            collectorId,
            pendingBy,
            notifiedBy,
            unitId,
            userId,
          },
          include: {
            unit: {
              select: {
                name: true,
              },
            },
          },
        })

        await logAction({
          userId,
          action: 'CREATE',
          resource: 'COLLECTION',
          resourceId: collection.id,
          details: `Registrou nova recoleta para o paciente ${patientName} (Código: ${patientCode}) na unidade ${collection.unit?.name ?? ''}`,
        })

        return reply.status(201).send({
          collectionId: collection.id,
        })
      }
    )
}
