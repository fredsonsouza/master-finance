import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function updateCollection(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/collections/:id',
      {
        schema: {
          tags: ['collections'],
          summary: 'Update a collection',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            requestDate: z.string().datetime(),
            patientCode: z.string(),
            patientName: z.string(),
            exams: z.array(z.string()),
            reason: z.string().max(120),
            collectorId: z.string().uuid(),
            pendingBy: z.string(),
            notifiedBy: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { id } = request.params
        const {
          requestDate,
          patientCode,
          patientName,
          exams,
          reason,
          collectorId,
          pendingBy,
          notifiedBy,
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

        if (ability.cannot('update', 'Collection')) {
          throw new UnauthorizedError(
            'You are not allowed to update collections.'
          )
        }

        const dateObj = new Date(requestDate)

        const collection = await prisma.collection.update({
          where: { id },
          data: {
            requestDate: dateObj,
            patientCode,
            patientName,
            exams,
            reason,
            collectorId,
            pendingBy,
            notifiedBy,
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
          action: 'UPDATE',
          resource: 'COLLECTION',
          resourceId: id,
          details: `Editou recoleta do paciente ${patientName} (Código: ${patientCode}) na unidade ${collection.unit?.name ?? ''}`,
        })

        return reply.status(204).send(null)
      }
    )
}
