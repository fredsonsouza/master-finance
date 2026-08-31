import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createHrReport(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/hr-reports',
      {
        schema: {
          tags: ['hr-reports'],
          summary: 'Create a new HR/Sector work report',
          security: [{ bearerAuth: [] }],
          body: z.object({
            title: z.string().min(1, 'Título é obrigatório.'),
            content: z.string().min(1, 'Conteúdo do relatório é obrigatório.'),
            reportDate: z.coerce.date(),
            status: z.enum(['DRAFT', 'SENT']).default('DRAFT'),
            unitId: z.string().uuid().optional().nullable(),
            sectorId: z.string().uuid().optional().nullable(),
          }),
          response: {
            201: z.object({
              reportId: z.string().uuid(),
              report: z.object({
                id: z.string().uuid(),
                title: z.string(),
                content: z.string(),
                reportDate: z.date(),
                status: z.enum(['DRAFT', 'SENT']),
                sentAt: z.date().nullable(),
                userId: z.string().uuid(),
                unitId: z.string().uuid().nullable(),
                sectorId: z.string().uuid().nullable(),
                createdAt: z.date(),
                updatedAt: z.date(),
              }),
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

        if (ability.cannot('create', 'HrReport')) {
          throw new UnauthorizedError(
            'Você não tem permissão para criar relatórios.'
          )
        }

        const {
          title,
          content,
          reportDate,
          status,
          unitId,
          sectorId,
        } = request.body

        const targetUnitId = unitId ?? requestingUser.unitId ?? null

        const isSent = status === 'SENT'
        const sentAt = isSent ? new Date() : null

        const report = await prisma.hrReport.create({
          data: {
            title: title.trim(),
            content: content.trim(),
            reportDate,
            status,
            sentAt,
            userId: requestingUser.id,
            unitId: targetUnitId,
            sectorId: sectorId ?? null,
          },
        })

        await logAction({
          userId: requestingUser.id,
          action: 'CREATE',
          resource: 'HR_REPORT',
          resourceId: report.id,
          details: `Criou relatório de setor "${report.title}" com status ${report.status}`,
        })

        return reply.status(201).send({
          reportId: report.id,
          report: {
            id: report.id,
            title: report.title,
            content: report.content,
            reportDate: report.reportDate,
            status: report.status,
            sentAt: report.sentAt,
            userId: report.userId,
            unitId: report.unitId,
            sectorId: report.sectorId,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
          },
        })
      }
    )
}
