import { randomBytes } from 'node:crypto'
import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
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
          summary: 'Reset a user password (Admin only)',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z
            .object({
              password: z.string().min(4).optional(),
            })
            .nullable()
            .optional(),
          response: {
            200: z.object({
              temporaryPassword: z.string(),
            }),
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

        // Apenas o usuário com a role ADMIN pode alterar/resetar a senha dos demais usuários
        if (requestingUser.role !== 'ADMIN') {
          throw new UnauthorizedError(
            'Apenas administradores podem alterar ou redefinir a senha de outros usuários.'
          )
        }

        const targetUser = await prisma.user.findUnique({
          where: { id: targetUserId },
        })

        if (!targetUser) {
          throw new BadRequestError('Usuário não encontrado.')
        }

        const customPassword = request.body?.password
        // Gerar senha temporária segura e legível quando não informada
        const temporarySecret =
          customPassword || `Master#${randomBytes(3).toString('hex').toUpperCase()}`
        const newPasswordHash = await hash(temporarySecret, 10)

        await prisma.user.update({
          where: { id: targetUserId },
          data: {
            password_hash: newPasswordHash,
            forcePasswordChange: customPassword ? false : true,
          },
        })

        await logAction({
          userId: requestingUser.id,
          action: 'UPDATE',
          resource: 'AUTH',
          resourceId: targetUserId,
          details: customPassword
            ? `Alterou a senha do usuário: ${targetUser.name} (${targetUser.username})`
            : `Resetou a senha do usuário: ${targetUser.name} (${targetUser.username}) com senha temporária segura`,
        })

        return reply.status(200).send({ temporaryPassword: temporarySecret })
      }
    )
}
