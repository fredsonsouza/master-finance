import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { validateAndNormalizeEmployeePhoto } from '@/utils/employee-photo'
import { type Permission, defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function updateEmployeePhoto(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/employees/:id/photo',
      {
        bodyLimit: 1_048_576, // 1 MB limit for JSON payload with 3x4 photo
        schema: {
          tags: ['employees'],
          summary: 'Upload, update, or remove an employee 3x4 photo',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            photoUrl: z.string().nullable(),
          }),
          response: {
            200: z.object({
              employeeId: z.string().uuid(),
              registrationNumber: z.string(),
              photoUrl: z.string().nullable(),
            }),
          },
        },
      },
      async (request, reply) => {
        const currentUserId = await request.getCurrentUserId()
        const { id } = request.params
        const { photoUrl } = request.body

        const requestingUser = await prisma.user.findUnique({
          where: { id: currentUserId },
        })

        if (!requestingUser) {
          throw new UnauthorizedError()
        }

        const ability = defineAbilityFor({
          id: requestingUser.id,
          role: requestingUser.role,
          unitId: requestingUser.unitId ?? undefined,
          permissions: requestingUser.permissions as Permission[],
        })

        if (ability.cannot('update', 'Employee')) {
          throw new UnauthorizedError(
            'Você não tem permissão para atualizar a foto de colaboradores.'
          )
        }

        const existingEmployee = await prisma.employee.findUnique({
          where: { id },
        })

        if (!existingEmployee) {
          throw new ResourceNotFoundError('Colaborador não encontrado.')
        }

        const normalizedPhoto =
          validateAndNormalizeEmployeePhoto(photoUrl) ?? null

        const updated = await prisma.employee.update({
          where: { id },
          data: {
            photoUrl: normalizedPhoto,
          },
        })

        await logAction({
          userId: currentUserId,
          action: 'UPDATE',
          resource: 'EMPLOYEE',
          resourceId: id,
          details: normalizedPhoto
            ? `Atualizou a foto 3x4 do colaborador ${updated.fullName} (Matrícula: ${updated.registrationNumber})`
            : `Removeu a foto 3x4 do colaborador ${updated.fullName} (Matrícula: ${updated.registrationNumber})`,
        })

        return reply.status(200).send({
          employeeId: updated.id,
          registrationNumber: updated.registrationNumber,
          photoUrl: updated.photoUrl,
        })
      }
    )
}
