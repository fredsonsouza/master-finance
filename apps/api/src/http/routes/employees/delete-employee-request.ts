import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function deleteEmployeeRequest(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/employee-requests/:id',
      {
        schema: {
          tags: ['employee-requests'],
          summary: 'Delete an employee document request or issued document',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          response: {
            204: z.null(),
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

        const existingRequest = await prisma.employeeRequest.findUnique({
          where: { id },
          include: {
            employee: { select: { fullName: true } },
          },
        })

        if (!existingRequest) {
          throw new ResourceNotFoundError('Solicitação não encontrada.')
        }

        const ability = defineAbilityFor({
          id: requestingUser.id,
          role: requestingUser.role,
          unitId: requestingUser.unitId,
        } as any)

        const canManageAll = ability.can('manage', 'EmployeeRequest')
        const isOwnOpenRequest =
          existingRequest.requestedById === currentUserId &&
          existingRequest.status === 'OPEN'

        if (!canManageAll && !isOwnOpenRequest) {
          throw new UnauthorizedError(
            'Você não tem permissão para excluir esta solicitação.'
          )
        }

        await prisma.employeeRequest.delete({
          where: { id },
        })

        await logAction({
          userId: currentUserId,
          action: 'DELETE',
          resource: 'EMPLOYEE_REQUEST',
          resourceId: id,
          details: `Excluiu a solicitação/documento "${existingRequest.title}" do colaborador ${existingRequest.employee.fullName}`,
        })

        return reply.status(204).send(null)
      }
    )
}
