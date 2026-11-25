import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { type Permission, defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function updateEmployeeSubmissionStatus(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/employee-submissions/:id/status',
      {
        schema: {
          tags: ['employee-submissions'],
          summary:
            'Review an employee PDF document submission (UNDER_REVIEW / APPROVED / REJECTED with required reason)',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']),
            reviewNotes: z.string().max(2000).nullable().optional(),
            rejectionReason: z.string().max(2000).nullable().optional(),
          }),
          response: {
            200: z.object({
              submission: z.any(),
            }),
          },
        },
      },
      async (request, reply) => {
        const currentUserId = await request.getCurrentUserId()
        const { id } = request.params
        const body = request.body

        const requestingUser = await prisma.user.findUnique({
          where: { id: currentUserId },
        })

        if (!requestingUser) {
          throw new UnauthorizedError()
        }

        const ability = defineAbilityFor({
          id: requestingUser.id,
          role: requestingUser.role,
          unitId: requestingUser.unitId,
          permissions: requestingUser.permissions as Permission[],
        })

        if (ability.cannot('manage', 'EmployeeSubmission')) {
          throw new UnauthorizedError(
            'Apenas o setor de RH ou Administração pode validar ou rejeitar documentos enviados.'
          )
        }

        const existing = await prisma.employeeDocumentSubmission.findUnique({
          where: { id },
          include: {
            employee: true,
          },
        })

        if (!existing) {
          throw new ResourceNotFoundError('Envio de documento não encontrado.')
        }

        if (body.status === 'REJECTED') {
          const trimmedReason = body.rejectionReason?.trim() || ''
          if (trimmedReason.length < 5) {
            throw new BadRequestError(
              'Informe o motivo da rejeição do documento (mínimo de 5 caracteres).'
            )
          }
        }

        const dataToUpdate: any = {
          status: body.status,
          reviewedById: body.status === 'PENDING' ? null : currentUserId,
          reviewedAt: body.status === 'PENDING' ? null : new Date(),
        }

        if (body.reviewNotes !== undefined) {
          dataToUpdate.reviewNotes = body.reviewNotes?.trim() || null
        }

        if (body.status === 'REJECTED') {
          dataToUpdate.rejectionReason = body.rejectionReason?.trim() || null
        } else {
          dataToUpdate.rejectionReason = null
        }

        const updated = await prisma.employeeDocumentSubmission.update({
          where: { id },
          data: dataToUpdate,
          include: {
            employee: {
              include: {
                unit: { select: { id: true, name: true } },
                sector: { select: { id: true, name: true } },
              },
            },
            submittedBy: {
              select: { id: true, name: true, role: true, permissions: true },
            },
            reviewedBy: {
              select: { id: true, name: true, role: true },
            },
          },
        })

        await logAction({
          userId: currentUserId,
          action: 'UPDATE',
          resource: 'EMPLOYEE_SUBMISSION',
          resourceId: id,
          details:
            body.status === 'APPROVED'
              ? `Validou o recebimento do documento "${updated.title}" (${updated.fileName}) de ${existing.employee.fullName}`
              : body.status === 'REJECTED'
                ? `Rejeitou o documento "${updated.title}" (${updated.fileName}) de ${existing.employee.fullName}. Motivo: ${dataToUpdate.rejectionReason}`
                : `Alterou o status do documento "${updated.title}" de ${existing.employee.fullName} para ${body.status}`,
        })

        return reply.status(200).send({
          submission: updated,
        })
      }
    )
}
