import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { type Permission, defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getDepartments(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/departments',
      {
        schema: {
          tags: ['departments'],
          summary: 'List all clinical departments',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              departments: z.array(
                z.object({
                  id: z.uuid(),
                  name: z.string(),
                  type: z.enum(['GENERAL', 'RECEPTION', 'COLLECTION']),
                  employeesCount: z.number(),
                  createdAt: z.date(),
                  updatedAt: z.date(),
                })
              ),
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

        if (ability.cannot('get', 'Department')) {
          throw new UnauthorizedError(
            'Você não tem permissão para visualizar departamentos.'
          )
        }

        const rawDepartments = await prisma.department.findMany({
          include: {
            _count: {
              select: { employees: true },
            },
          },
          orderBy: { name: 'asc' },
        })

        const departments = rawDepartments.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          employeesCount: d._count.employees,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        }))

        return reply.status(200).send({ departments })
      }
    )
}
