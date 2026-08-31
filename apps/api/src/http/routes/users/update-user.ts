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

export async function updateUser(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/users/:id',
      {
        schema: {
          tags: ['users'],
          summary: 'Update user details',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            name: z.string().optional(),
            password: z.string().min(4).optional(),
            role: z
              .enum([
                'ADMIN',
                'MANAGER',
                'EMPLOYEE',
                'FINANCIAL',
                'SELLER',
                'COLLECTOR',
                'FISCAL',
                'INVENTORY',
                'ANALYST',
              ])
              .optional(),
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
        } as any)

        if (ability.cannot('manage', 'User')) {
          throw new UnauthorizedError('You are not allowed to update users.')
        }

        const targetUser = await prisma.user.findUnique({
          where: { id: targetUserId },
        })

        if (!targetUser) {
          throw new BadRequestError('User not found.')
        }

        const { name, password, role, unitId } = request.body

        if (role === 'ADMIN' && requestingUser.role !== 'ADMIN') {
          throw new UnauthorizedError('Only admins can assign the admin role.')
        }

        if (targetUser.role === 'ADMIN' && requestingUser.role !== 'ADMIN') {
          throw new UnauthorizedError('You cannot update an admin user.')
        }

        if (password && requestingUser.role !== 'ADMIN') {
          throw new UnauthorizedError(
            'Apenas administradores podem alterar a senha de outros usuários.'
          )
        }

        const dataToUpdate: any = {
          name: name !== undefined ? name : targetUser.name,
          role: role !== undefined ? role : targetUser.role,
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
            ? `Editou dados e redefiniu senha do usuário ${updated.name} (${updated.username}). Cargo: ${updated.role}`
            : `Editou o usuário ${updated.name} (${updated.username}). Cargo: ${updated.role}`,
        })

        return reply.status(204).send(null)
      }
    )
}
