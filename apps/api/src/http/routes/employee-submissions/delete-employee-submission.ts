import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { type Permission, defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function deleteEmployeeSubmission(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/employee-submissions/:id',
      {
        schema: {
          tags: ['employee-submissions'],
          summary:
            'Delete a submitted employee PDF document (HR/Admin or owner while PENDING)',
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

        const existing = await prisma.employeeDocumentSubmission.findUnique({
          where: { id },
          include: {
            employee: { select: { fullName: true } },
          },
        })

        if (!existing) {
          throw new ResourceNotFoundError('Envio de documento não encontrado.')
        }

        const ability = defineAbilityFor({
          id: requestingUser.id,
          role: requestingUser.role,
          unitId: requestingUser.unitId,
          permissions: requestingUser.permissions as Permission[],
        })

        const canManageAll = ability.can('manage', 'EmployeeSubmission')
        const isOwnPending =
          existing.submittedById === currentUserId &&
          existing.status === 'PENDING'

        if (!canManageAll && !isOwnPending) {
          throw new UnauthorizedError(
            'Você não tem permissão para excluir este envio de documento.'
          )
        }

        await prisma.employeeDocumentSubmission.delete({
          where: { id },
        })

        await logAction({
          userId: currentUserId,
          action: 'DELETE',
          resource: 'EMPLOYEE_SUBMISSION',
          resourceId: id,
          details: `Excluiu o documento enviado "${existing.title}" (${existing.fileName}) do colaborador ${existing.employee.fullName}`,
        })

        return reply.status(204).send(null)
      }
    )
}
