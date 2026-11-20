import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { type Permission, defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createDepartment(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/departments',
      {
        schema: {
          tags: ['departments'],
          summary: 'Create a new clinical department (HR)',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string().trim().min(2),
            type: z
              .enum(['GENERAL', 'RECEPTION', 'COLLECTION'])
              .default('GENERAL'),
          }),
          response: {
            201: z.object({
              departmentId: z.uuid(),
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
          permissions: requestingUser.permissions as Permission[],
        })

        if (ability.cannot('manage', 'Department')) {
          throw new UnauthorizedError(
            'Você não tem permissão para criar departamentos.'
          )
        }

        const { name, type } = request.body

        const existing = await prisma.department.findFirst({
          where: {
            name: { equals: name, mode: 'insensitive' },
          },
        })

        if (existing) {
          throw new BadRequestError(
            'Já existe um departamento cadastrado com este nome.'
          )
        }

        const department = await prisma.department.create({
          data: {
            name,
            type,
          },
        })

        await logAction({
          userId,
          action: 'CREATE',
          resource: 'DEPARTMENT',
          resourceId: department.id,
          details: `Criou o departamento ${name} (Tipo: ${type})`,
        })

        return reply.status(201).send({ departmentId: department.id })
      }
    )
}
