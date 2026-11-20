import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { roleSchema } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'

export async function getProfile(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/profile',
      {
        schema: {
          tags: ['auth'],
          summary: 'Get authenticated user profile',
          response: {
            200: z.object({
              user: z.object({
                id: z.string().uuid(),
                name: z.string().nullable(),
                username: z.string(),
                avatarUrl: z.string().url().nullable(),
                forcePasswordChange: z.boolean(),
                role: roleSchema,
                permissions: z.array(z.string()),
                unitId: z.string().uuid().nullable(),
                unit: z
                  .object({
                    id: z.string().uuid(),
                    name: z.string(),
                  })
                  .nullable()
                  .optional(),
                employee: z
                  .object({
                    id: z.string().uuid(),
                    registrationNumber: z.string(),
                    status: z.enum(['ACTIVE', 'INACTIVE']),
                    roleTitle: z.string(),
                    department: z
                      .object({
                        id: z.string().uuid(),
                        name: z.string(),
                        type: z.enum(['GENERAL', 'RECEPTION', 'COLLECTION']),
                      })
                      .nullable()
                      .optional(),
                  })
                  .nullable()
                  .optional(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const { sub } = await request.jwtVerify<{ sub: string }>()

        const user = await prisma.user.findUnique({
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            forcePasswordChange: true,
            role: true,
            permissions: true,
            unitId: true,
            unit: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          where: {
            id: sub,
          },
        })
        if (!user) throw new ResourceNotFoundError('User not found')

        let employee: {
          id: string
          registrationNumber: string
          status: 'ACTIVE' | 'INACTIVE'
          roleTitle: string
          department?: {
            id: string
            name: string
            type: 'GENERAL' | 'RECEPTION' | 'COLLECTION'
          } | null
        } | null = null

        if (prisma.employee?.findUnique) {
          try {
            employee = await prisma.employee.findUnique({
              where: { userId: user.id },
              select: {
                id: true,
                registrationNumber: true,
                status: true,
                roleTitle: true,
                department: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
            })
          } catch {
            employee = null
          }
        }

        return reply.send({
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            forcePasswordChange: user.forcePasswordChange,
            role: user.role,
            permissions: user.permissions ?? [],
            unitId: user.unitId,
            unit: user.unit,
            employee,
          },
        })
      }
    )
}
