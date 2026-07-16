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

export async function resetPassword(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/users/:id/reset-password',
      {
        schema: {
          tags: ['auth'],
          summary: 'Reset an employee password (Manager/Admin only)',
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
          throw new UnauthorizedError('You are not allowed to reset passwords.')
        }

        const targetUser = await prisma.user.findUnique({
          where: { id: targetUserId },
        })

        if (!targetUser) {
          throw new BadRequestError('User not found.')
        }

        const defaultPasswordHash = await hash('123', 6)

        await prisma.user.update({
          where: { id: targetUserId },
          data: {
            password_hash: defaultPasswordHash,
            forcePasswordChange: true,
          },
        })

        await logAction({
          userId: requestingUser.id,
          action: 'UPDATE',
          resource: 'AUTH',
          resourceId: targetUserId,
          details: `Resetou a senha do usuário: ${targetUser.name} (${targetUser.username})`,
        })

        return reply.status(204).send(null)
      }
    )
}
