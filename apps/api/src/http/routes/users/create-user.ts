import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import {
  type Permission,
  canGrantAccess,
  defineAbilityFor,
  permissionSchema,
  roleSchema,
} from '@saas/auth'
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
          summary: 'Create a new user with PBAC permissions',
          tags: ['users'],
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string().min(2),
            username: z
              .string()
              .min(3)
              .regex(/^[a-zA-Z0-9_.\- ]+$/),
            password: z.string().min(4),
            role: roleSchema.default('EMPLOYEE'),
            permissions: z.array(permissionSchema).default([]),
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
          permissions: requestingUser.permissions as Permission[],
        })

        if (ability.cannot('manage', 'User')) {
          throw new UnauthorizedError('You are not allowed to create users.')
        }

        const { name, username, password, role, permissions, unitId } =
          request.body

        const uniquePermissions =
          role === 'ADMIN' ? [] : Array.from(new Set(permissions))

        const grantCheck = canGrantAccess(
          {
            role: requestingUser.role,
            permissions: requestingUser.permissions as Permission[],
          },
          role,
          uniquePermissions
        )

        if (!grantCheck.allowed) {
          throw new UnauthorizedError(grantCheck.reason)
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
            permissions: uniquePermissions,
            unitId,
          },
        })

        await logAction({
          userId,
          action: 'CREATE',
          resource: 'USER',
          resourceId: user.id,
          details: `Cadastrou o usuário ${name} (${username}) como ${role} com ${uniquePermissions.length} permissões`,
        })

        return reply.status(201).send({ userId: user.id })
      }
    )
}
