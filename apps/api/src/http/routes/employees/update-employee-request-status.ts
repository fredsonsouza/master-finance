import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { generateElectronicSignature } from '@/utils/employee-registration'
import { type Permission, defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function updateEmployeeRequestStatus(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/employee-requests/:id/status',
      {
        schema: {
          tags: ['employee-requests'],
          summary:
            'Update document request status (OPEN -> IN_PROGRESS -> COMPLETED / REJECTED) and sign electronically',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']),
            title: z.string().min(2).optional(),
            description: z.string().min(2).optional(),
            amount: z.number().nullable().optional(),
            templateData: z.any().optional(),
            rejectionReason: z.string().nullable().optional(),
          }),
          response: {
            200: z.object({
              request: z.any(),
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

        if (ability.cannot('manage', 'EmployeeRequest')) {
          throw new UnauthorizedError(
            'Apenas o setor de RH ou Gerência pode gerenciar o status das solicitações.'
          )
        }

        const existingRequest = await prisma.employeeRequest.findUnique({
          where: { id },
          include: {
            employee: true,
            requestedBy: {
              select: {
                id: true,
                name: true,
                role: true,
                permissions: true,
                unitId: true,
              },
            },
          },
        })

        if (!existingRequest) {
          throw new ResourceNotFoundError('Solicitação não encontrada.')
        }

        if (body.status === 'REJECTED') {
          if (existingRequest.status === 'COMPLETED') {
            throw new BadRequestError(
              'Não é possível rejeitar um documento que já foi finalizado e assinado.'
            )
          }

          const requesterAbility = existingRequest.requestedBy
            ? defineAbilityFor({
                id: existingRequest.requestedBy.id,
                role: existingRequest.requestedBy.role,
                unitId: existingRequest.requestedBy.unitId,
                permissions: (existingRequest.requestedBy.permissions ??
                  []) as Permission[],
              })
            : null

          const requestedBySelf =
            Boolean(existingRequest.employee.userId) &&
            existingRequest.employee.userId === existingRequest.requestedById
          const requestedByNonHr = requesterAbility
            ? requesterAbility.cannot('manage', 'EmployeeRequest')
            : false

          if (!requestedBySelf && !requestedByNonHr) {
            throw new BadRequestError(
              'Apenas solicitações iniciadas por colaboradores podem ser rejeitadas.'
            )
          }

          const trimmedReason = body.rejectionReason?.trim() || ''
          if (trimmedReason.length < 5) {
            throw new BadRequestError(
              'Informe o motivo da rejeição da solicitação (mínimo de 5 caracteres).'
            )
          }
        }

        const updatedTitle =
          body.title !== undefined ? body.title.trim() : existingRequest.title
        const updatedDescription =
          body.description !== undefined
            ? body.description.trim()
            : existingRequest.description

        const dataToUpdate: any = {
          status: body.status,
          title: updatedTitle,
          description: updatedDescription,
        }

        if (body.amount !== undefined) {
          dataToUpdate.amount = body.amount
        }

        if (body.templateData !== undefined) {
          dataToUpdate.templateData = body.templateData
        }

        if (body.status === 'REJECTED') {
          dataToUpdate.rejectionReason = body.rejectionReason?.trim() || null
          dataToUpdate.issuedById = currentUserId
        } else if (body.rejectionReason !== undefined) {
          dataToUpdate.rejectionReason = null
        } else if (existingRequest.status === 'REJECTED') {
          dataToUpdate.rejectionReason = null
        }

        if (body.status === 'COMPLETED' && !existingRequest.verificationCode) {
          const signedAt = new Date()
          const sig = generateElectronicSignature({
            employeeId: existingRequest.employeeId,
            type: existingRequest.type,
            subtype: existingRequest.subtype,
            title: updatedTitle,
            description: updatedDescription,
            issuedById: currentUserId,
            signedAt,
          })

          dataToUpdate.verificationCode = sig.verificationCode
          dataToUpdate.contentHash = sig.contentHash
          dataToUpdate.signedAt = signedAt
          dataToUpdate.issuedById = currentUserId
        }

        const updated = await prisma.employeeRequest.update({
          where: { id },
          data: dataToUpdate,
          include: {
            employee: {
              include: {
                unit: { select: { id: true, name: true } },
                sector: { select: { id: true, name: true } },
              },
            },
            requestedBy: {
              select: { id: true, name: true, role: true, permissions: true },
            },
            issuedBy: { select: { id: true, name: true, role: true } },
          },
        })

        await logAction({
          userId: currentUserId,
          action: 'UPDATE',
          resource: 'EMPLOYEE_REQUEST',
          resourceId: id,
          details:
            body.status === 'COMPLETED'
              ? `Finalizou e assinou eletronicamente o documento "${updated.title}" (Protocolo: ${updated.verificationCode}) para ${existingRequest.employee.fullName}`
              : body.status === 'REJECTED'
                ? `Rejeitou a solicitação "${updated.title}" de ${existingRequest.employee.fullName}. Motivo: ${dataToUpdate.rejectionReason}`
                : `Alterou o status da solicitação "${updated.title}" de ${existingRequest.employee.fullName} para ${body.status}`,
        })

        return reply.status(200).send({
          request: updated,
        })
      }
    )
}
