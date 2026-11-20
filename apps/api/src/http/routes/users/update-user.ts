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

export async function updateUser(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/users/:id',
      {
        schema: {
          tags: ['users'],
          summary: 'Update user details and PBAC permissions',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            name: z.string().optional(),
            password: z.string().min(4).optional(),
            role: roleSchema.optional(),
            permissions: z.array(permissionSchema).optional(),
            unitId: z.string().uuid().nullable().optional(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const targetUserId = request.params.id

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
          throw new UnauthorizedError('You are not allowed to update users.')
        }

        const targetUser = await prisma.user.findUnique({
          where: { id: targetUserId },
        })

        if (!targetUser) {
          throw new BadRequestError('User not found.')
        }

        const { name, password, role, permissions, unitId } = request.body

        if (targetUser.role === 'ADMIN' && requestingUser.role !== 'ADMIN') {
          throw new UnauthorizedError('You cannot update an admin user.')
        }

        if (
          targetUserId === requestingUser.id &&
          requestingUser.role !== 'ADMIN' &&
          (role !== undefined || permissions !== undefined)
        ) {
          throw new UnauthorizedError(
            'Você não pode alterar o próprio perfil ou permissões.'
          )
        }

        const nextRole = role ?? targetUser.role
        const nextPermissions =
          nextRole === 'ADMIN'
            ? []
            : permissions !== undefined
              ? Array.from(new Set(permissions))
              : ((targetUser.permissions ?? []) as Permission[])

        const grantCheck = canGrantAccess(
          {
            role: requestingUser.role,
            permissions: requestingUser.permissions as Permission[],
          },
          nextRole,
          nextPermissions
        )

        if (!grantCheck.allowed) {
          throw new UnauthorizedError(grantCheck.reason)
        }

        if (password && requestingUser.role !== 'ADMIN') {
          throw new UnauthorizedError(
            'Apenas administradores podem alterar a senha de outros usuários.'
          )
        }

        const dataToUpdate: any = {
          name: name !== undefined ? name : targetUser.name,
          role: nextRole,
          permissions: nextPermissions,
          unitId: unitId !== undefined ? unitId : targetUser.unitId,
        }

        if (password) {
          dataToUpdate.password_hash = await hash(password, 6)
          dataToUpdate.forcePasswordChange = false
        }

        const updated = await prisma.user.update({
          where: { id: targetUserId },
          data: dataToUpdate,
        })

        await logAction({
          userId,
          action: 'UPDATE',
          resource: 'USER',
          resourceId: targetUserId,
          details: password
            ? `Editou dados, permissões e redefiniu senha do usuário ${updated.name} (${updated.username}). Perfil: ${updated.role}`
            : `Editou o usuário ${updated.name} (${updated.username}). Perfil: ${updated.role} (${nextPermissions.length} permissões)`,
        })

        return reply.status(204).send(null)
      }
    )
}
