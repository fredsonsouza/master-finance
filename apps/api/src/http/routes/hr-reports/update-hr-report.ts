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

export async function updateHrReport(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/hr-reports/:id',
      {
        schema: {
          tags: ['hr-reports'],
          summary: 'Update or submit an HR/Sector work report',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            title: z.string().min(1).optional(),
            content: z.string().min(1).optional(),
            reportDate: z.coerce.date().optional(),
            status: z.enum(['DRAFT', 'SENT']).optional(),
            unitId: z.string().uuid().optional().nullable(),
            sectorId: z.string().uuid().optional().nullable(),
          }),
          response: {
            200: z.object({
              report: z.object({
                id: z.string().uuid(),
                title: z.string(),
                content: z.string(),
                reportDate: z.date(),
                status: z.enum(['DRAFT', 'SENT']),
                sentAt: z.date().nullable(),
                createdAt: z.date(),
                updatedAt: z.date(),
              }),
            }),
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
              'Você não tem permissão para editar este relatório.'
            )
          }

          if (report.status === 'SENT') {
            throw new BadRequestError(
              'Relatórios já enviados ao RH não podem ser alterados.'
            )
          }
        }

        const {
          title,
          content,
          reportDate,
          status,
          unitId,
          sectorId,
        } = request.body

        const isBecomingSent =
          status === 'SENT' && (report.status === 'DRAFT' || !report.sentAt)

        const updatedReport = await prisma.hrReport.update({
          where: { id },
          data: {
            title: title !== undefined ? title.trim() : undefined,
            content: content !== undefined ? content.trim() : undefined,
            reportDate: reportDate !== undefined ? reportDate : undefined,
            status: status !== undefined ? status : undefined,
            sentAt: isBecomingSent ? new Date() : undefined,
            unitId: unitId !== undefined ? unitId : undefined,
            sectorId: sectorId !== undefined ? sectorId : undefined,
          },
        })

        await logAction({
          userId: requestingUser.id,
          action: 'UPDATE',
          resource: 'HR_REPORT',
          resourceId: updatedReport.id,
          details: `Atualizou o relatório "${updatedReport.title}" (status: ${updatedReport.status})`,
        })

        return reply.status(200).send({
          report: {
            id: updatedReport.id,
            title: updatedReport.title,
            content: updatedReport.content,
            reportDate: updatedReport.reportDate,
            status: updatedReport.status,
            sentAt: updatedReport.sentAt,
            createdAt: updatedReport.createdAt,
            updatedAt: updatedReport.updatedAt,
          },
        })
      }
    )
}
