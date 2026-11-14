import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getEmployee(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/employees/:id',
      {
        schema: {
          tags: ['employees'],
          summary:
            'Get full employee record (Ficha de Registro) and document history',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          response: {
            200: z.object({
              employee: z.any(),
            }),
          },
        },
      },
      async (request, reply) => {
        const currentUserId = await request.getCurrentUserId()
        const { id } = request.params

        const requestingUser = await prisma.user.findUnique({
          where: { id: currentUserId },
        })

        if (!requestingUser) {
          throw new UnauthorizedError()
        }

        const employee = await prisma.employee.findUnique({
          where: { id },
          include: {
            unit: { select: { id: true, name: true } },
            sector: { select: { id: true, name: true } },
            user: {
              select: { id: true, name: true, username: true, role: true },
            },
            createdBy: { select: { id: true, name: true } },
            requests: {
              orderBy: { createdAt: 'desc' },
              include: {
                requestedBy: { select: { id: true, name: true, role: true } },
                issuedBy: { select: { id: true, name: true, role: true } },
              },
            },
          },
        })

        if (!employee) {
          throw new ResourceNotFoundError('Colaborador não encontrado.')
        }

        const ability = defineAbilityFor({
          id: requestingUser.id,
          role: requestingUser.role,
          unitId: requestingUser.unitId,
        } as any)

        const isOwnProfile = employee.userId === requestingUser.id

        if (ability.cannot('get', 'Employee') && !isOwnProfile) {
          throw new UnauthorizedError(
            'Você não tem permissão para visualizar este colaborador.'
          )
        }

        return reply.status(200).send({ employee })
      }
    )
}
