import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { type Permission, defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function updateDepartment(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/departments/:departmentId',
      {
        schema: {
          tags: ['departments'],
          summary: 'Update a clinical department',
          security: [{ bearerAuth: [] }],
          params: z.object({
            departmentId: z.uuid(),
          }),
          body: z.object({
            name: z.string().trim().min(2).optional(),
            type: z.enum(['GENERAL', 'RECEPTION', 'COLLECTION']).optional(),
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
            'Você não tem permissão para editar departamentos.'
          )
        }

        const { departmentId } = request.params
        const { name, type } = request.body

        const existing = await prisma.department.findUnique({
          where: { id: departmentId },
        })

        if (!existing) {
          throw new BadRequestError('Departamento não encontrado.')
        }

        if (name && name.toLowerCase() !== existing.name.toLowerCase()) {
          const duplicate = await prisma.department.findFirst({
            where: {
              id: { not: departmentId },
              name: { equals: name, mode: 'insensitive' },
            },
          })

          if (duplicate) {
            throw new BadRequestError(
              'Já existe outro departamento com este nome.'
            )
          }
        }

        const updated = await prisma.department.update({
          where: { id: departmentId },
          data: {
            ...(name !== undefined ? { name } : {}),
            ...(type !== undefined ? { type } : {}),
          },
        })

        await logAction({
          userId,
          action: 'UPDATE',
          resource: 'DEPARTMENT',
          resourceId: departmentId,
          details: `Atualizou o departamento ${existing.name} -> ${updated.name} (Tipo: ${updated.type})`,
        })

        return reply.status(204).send(null)
      }
    )
}
