import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getHrReport(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/hr-reports/:id',
      {
        schema: {
          tags: ['hr-reports'],
          summary: 'Get details of an HR/Sector work report',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
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
                user: z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  username: z.string(),
                  role: z.string(),
                }),
                unit: z
                  .object({
                    id: z.string().uuid(),
                    name: z.string(),
                  })
                  .nullable(),
                sector: z
                  .object({
                    id: z.string().uuid(),
                    name: z.string(),
                  })
                  .nullable(),
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true,
              },
            },
            unit: {
              select: {
                id: true,
                name: true,
              },
            },
            sector: {
              select: {
                id: true,
                name: true,
              },
            },
          },
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
        if (!canManage && report.userId !== requestingUser.id) {
          throw new UnauthorizedError(
            'Você não tem permissão para visualizar este relatório.'
          )
        }

        return reply.status(200).send({
          report: {
            id: report.id,
            title: report.title,
            content: report.content,
            reportDate: report.reportDate,
            status: report.status,
            sentAt: report.sentAt,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            user: {
              id: report.user.id,
              name: report.user.name,
              username: report.user.username,
              role: report.user.role,
            },
            unit: report.unit
              ? {
                  id: report.unit.id,
                  name: report.unit.name,
                }
              : null,
            sector: report.sector
              ? {
                  id: report.sector.id,
                  name: report.sector.name,
                }
              : null,
          },
        })
      }
    )
}
