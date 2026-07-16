import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

export async function updatePassword(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/users/update-password',
      {
        schema: {
          tags: ['auth'],
          summary: 'Update your own password',
          body: z.object({
            password: z.string().min(4),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { password } = request.body

        const newPasswordHash = await hash(password, 6)

        await prisma.user.update({
          where: { id: userId },
          data: {
            password_hash: newPasswordHash,
            forcePasswordChange: false,
          },
        })

        await logAction({
          userId,
          action: 'UPDATE',
          resource: 'AUTH',
          resourceId: userId,
          details: 'Alterou a própria senha de acesso.',
        })

        return reply.status(204).send(null)
      }
    )
}
