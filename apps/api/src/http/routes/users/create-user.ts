import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { defineAbilityFor } from '@saas/auth'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function createUser(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/users/admin',
      {
        schema: {
          summary: 'Create a new user by Admin/Manager',
          tags: ['users'],
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
            password: z.string().min(4),
            role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']),
            unitId: z.string().uuid().nullable().optional(),
          }),
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
        } as any)

        if (ability.cannot('manage', 'User')) {
          throw new UnauthorizedError('You are not allowed to create users.')
        }

        const { name, username, password, role, unitId } = request.body

        const userWithSameUsername = await prisma.user.findUnique({
          where: { username },
        })

        if (userWithSameUsername) {
          throw new BadRequestError('Username already taken!')
        }

        const password_hash = await hash(password, 6)

        const user = await prisma.user.create({
          data: {
            name,
            username,
            password_hash,
            role,
            unitId,
          },
        })

        return reply.status(201).send({ userId: user.id })
      }
    )
}
