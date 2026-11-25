import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { type Permission, defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getEmployeeSubmissionFile(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/employee-submissions/:id/file',
      {
        schema: {
          tags: ['employee-submissions'],
          summary:
            'Download or view the PDF attachment of an employee document submission (HR/Admin or submission owner only)',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          querystring: z.object({
            download: z.enum(['0', '1', 'true', 'false']).optional(),
          }),
        },
      },
      async (request, reply) => {
        const currentUserId = await request.getCurrentUserId()
        const { id } = request.params
        const shouldDownload =
          request.query.download === '1' || request.query.download === 'true'

        const requestingUser = await prisma.user.findUnique({
          where: { id: currentUserId },
          include: {
            employee: { select: { id: true } },
          },
        })

        if (!requestingUser) {
          throw new UnauthorizedError()
        }

        const submission = await prisma.employeeDocumentSubmission.findUnique({
          where: { id },
          include: {
            employee: { select: { id: true, userId: true } },
            file: true,
          },
        })

        if (!submission || !submission.file) {
          throw new ResourceNotFoundError('Arquivo PDF não encontrado.')
        }

        const ability = defineAbilityFor({
          id: requestingUser.id,
          role: requestingUser.role,
          unitId: requestingUser.unitId,
          permissions: requestingUser.permissions as Permission[],
        })

        const canManageAll = ability.can('manage', 'EmployeeSubmission')
        const isOwner =
          submission.submittedById === currentUserId ||
          submission.employee.userId === currentUserId ||
          (requestingUser.employee?.id &&
            requestingUser.employee.id === submission.employeeId)

        if (!canManageAll && !isOwner) {
          throw new UnauthorizedError(
            'Você não tem permissão para visualizar ou baixar este documento.'
          )
        }

        const disposition = shouldDownload ? 'attachment' : 'inline'
        const safeFileName = submission.fileName.replace(/["\\\r\n]/g, '_')
        const pdfBuffer = Buffer.from(submission.file.content)

        return reply
          .status(200)
          .header('Content-Type', 'application/pdf')
          .header(
            'Content-Disposition',
            `${disposition}; filename="${safeFileName}"`
          )
          .header('Content-Length', String(pdfBuffer.byteLength))
          .header('Cache-Control', 'private, no-store')
          .header('X-Content-Type-Options', 'nosniff')
          .send(pdfBuffer)
      }
    )
}
