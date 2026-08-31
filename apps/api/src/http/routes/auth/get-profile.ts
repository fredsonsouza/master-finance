import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
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
          summary: 'Get Authenticated with e-mail & password',
          response: {
            200: z.object({
              user: z.object({
                id: z.string().uuid(),
                name: z.string().nullable(),
                username: z.string(),
                avatarUrl: z.string().url().nullable(),
                forcePasswordChange: z.boolean(),
                role: z.enum([
                  'ADMIN',
                  'MANAGER',
                  'EMPLOYEE',
                  'FINANCIAL',
                  'SELLER',
                  'COLLECTOR',
                  'FISCAL',
                  'INVENTORY',
                  'ANALYST',
                ]),
                unitId: z.string().uuid().nullable(),
                unit: z
                  .object({
                    id: z.string().uuid(),
                    name: z.string(),
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

        return reply.send({
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            forcePasswordChange: user.forcePasswordChange,
            role: user.role,
            unitId: user.unitId,
            unit: user.unit,
          },
        })
      }
    )
}
