import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function changeEmployeeStatus(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/employees/:id/status',
      {
        schema: {
          tags: ['employees'],
          summary: 'Activate or inactivate an employee',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            status: z.enum(['ACTIVE', 'INACTIVE']),
            terminationDate: z.string().nullable().optional(),
            terminationType: z.string().nullable().optional(),
            terminationNotes: z.string().nullable().optional(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const currentUserId = await request.getCurrentUserId()
        const { id } = request.params
        const { status, terminationDate, terminationType, terminationNotes } =
          request.body

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
        } as any)

        if (ability.cannot('update', 'Employee')) {
          throw new UnauthorizedError(
            'Você não tem permissão para ativar ou inativar colaboradores.'
          )
        }

        const employee = await prisma.employee.findUnique({
          where: { id },
        })

        if (!employee) {
          throw new ResourceNotFoundError('Colaborador não encontrado.')
        }

        const dataToUpdate: any = {
          status,
        }

        if (status === 'INACTIVE') {
          dataToUpdate.terminationDate = terminationDate
            ? new Date(terminationDate)
            : new Date()
          dataToUpdate.terminationType =
            terminationType !== undefined
              ? terminationType
              : employee.terminationType
          dataToUpdate.terminationNotes =
            terminationNotes !== undefined
              ? terminationNotes
              : employee.terminationNotes
        } else {
          dataToUpdate.terminationDate = null
          dataToUpdate.terminationType = null
          dataToUpdate.terminationNotes = null
        }

        await prisma.employee.update({
          where: { id },
          data: dataToUpdate,
        })

        await logAction({
          userId: currentUserId,
          action: 'UPDATE',
          resource: 'EMPLOYEE',
          resourceId: id,
          details:
            status === 'INACTIVE'
              ? `Inativou o colaborador ${employee.fullName} (Matrícula: ${employee.registrationNumber})`
              : `Ativou o colaborador ${employee.fullName} (Matrícula: ${employee.registrationNumber})`,
        })

        return reply.status(204).send(null)
      }
    )
}
