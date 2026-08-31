import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

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
            username: z
              .string()
              .min(3)
              .regex(/^[a-zA-Z0-9_.\- ]+$/),
            password: z.string().min(4),
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

        if (role === 'ADMIN' && requestingUser.role !== 'ADMIN') {
          throw new UnauthorizedError('Only admins can create other admins.')
        }

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

        await logAction({
          userId,
          action: 'CREATE',
          resource: 'USER',
          resourceId: user.id,
          details: `Cadastrou o usuário ${name} (${username}) com a permissão ${role}`,
        })

        return reply.status(201).send({ userId: user.id })
      }
    )
}
