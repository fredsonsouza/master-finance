import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { type Permission, defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function deleteDepartment(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/departments/:departmentId',
      {
        schema: {
          tags: ['departments'],
          summary: 'Delete a clinical department',
          security: [{ bearerAuth: [] }],
          params: z.object({
            departmentId: z.uuid(),
          }),
          response: {
            204: z.null(),
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
          permissions: requestingUser.permissions as Permission[],
        })

        if (ability.cannot('manage', 'Department')) {
          throw new UnauthorizedError(
            'Você não tem permissão para remover departamentos.'
          )
        }

        const { departmentId } = request.params

        const department = await prisma.department.findUnique({
          where: { id: departmentId },
        })

        if (!department) {
          throw new BadRequestError('Departamento não encontrado.')
        }

        await prisma.department.delete({
          where: { id: departmentId },
        })

        await logAction({
          userId,
          action: 'DELETE',
          resource: 'DEPARTMENT',
          resourceId: departmentId,
          details: `Removeu o departamento ${department.name} (Tipo: ${department.type})`,
        })

        return reply.status(204).send(null)
      }
    )
}
