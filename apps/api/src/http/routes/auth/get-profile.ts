import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'

export async function getProfile(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/profile',
    {
      schema: {
        tags: ['auth'],
        summary: 'Get Authenticated with e-mail & password',
        response: {
          200: z.object({
            user: z.object({
              id: z.uuid(),
              name: z.string(),
              username: z.string(),
              avatarUrl: z.url().nullable(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { sub } = await request.jwtVerify<{ sub: string }>()

      const user = await prisma.user.findUnique({
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
        where: {
          id: sub,
        },
      })
      if (!user) throw new ResourceNotFoundError('User not found')

      return reply.send({
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
        },
      })
    }
  )
}
