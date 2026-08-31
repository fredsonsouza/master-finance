import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function deleteHrReport(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/hr-reports/:id',
      {
        schema: {
          tags: ['hr-reports'],
          summary: 'Delete an HR/Sector work report draft',
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
        const userId = await request.getCurrentUserId()
        const { id } = request.params

        const requestingUser = await prisma.user.findUnique({
          where: { id: userId },
        })

        if (!requestingUser) {
          throw new UnauthorizedError()
        }

        const report = await prisma.hrReport.findUnique({
          where: { id },
        })

        if (!report) {
          throw new ResourceNotFoundError('Relatório não encontrado.')
        }

        const ability = defineAbilityFor({
          id: requestingUser.id,
          role: requestingUser.role,
          unitId: requestingUser.unitId,
        } as any)

        const canManage = ability.can('manage', 'HrReport')

        if (!canManage) {
          if (report.userId !== requestingUser.id) {
            throw new UnauthorizedError(
              'Você não tem permissão para excluir este relatório.'
            )
          }

          if (report.status === 'SENT') {
            throw new BadRequestError(
              'Relatórios já enviados ao RH não podem ser excluídos.'
            )
          }
        }

        await prisma.hrReport.delete({
          where: { id },
        })

        await logAction({
          userId: requestingUser.id,
          action: 'DELETE',
          resource: 'HR_REPORT',
          resourceId: report.id,
          details: `Excluiu o relatório de setor "${report.title}"`,
        })

        return reply.status(204).send(null)
      }
    )
}
