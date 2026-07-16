import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

export async function updateProfile(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/profile',
      {
        schema: {
          tags: ['auth'],
          summary: 'Update user profile',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string().min(1),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { name } = request.body

        await prisma.user.update({
          where: { id: userId },
          data: { name },
        })

        return reply.status(204).send(null)
      }
    )
}
