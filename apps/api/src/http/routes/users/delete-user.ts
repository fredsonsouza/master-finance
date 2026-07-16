import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function deleteUser(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/users/:id',
      {
        schema: {
          tags: ['users'],
          summary: 'Delete a user',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.uuid(),
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
          throw new UnauthorizedError('You are not allowed to delete users.')
        }

        if (targetUserId === userId) {
          throw new BadRequestError('You cannot delete yourself.')
        }

        const targetUser = await prisma.user.findUnique({
          where: { id: targetUserId },
        })

        if (!targetUser) {
          throw new BadRequestError('User not found.')
        }

        if (targetUser.role === 'ADMIN' && requestingUser.role !== 'ADMIN') {
          throw new UnauthorizedError('You cannot delete an admin user.')
        }

        await prisma.user.delete({
          where: { id: targetUserId },
        })

        await logAction({
          userId,
          action: 'DELETE',
          resource: 'USER',
          resourceId: targetUserId,
          details: `Removeu o usuário ${targetUser.name} (${targetUser.username}) com cargo ${targetUser.role}`,
        })

        return reply.status(204).send(null)
      }
    )
}
