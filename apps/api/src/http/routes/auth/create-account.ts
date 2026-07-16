import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/users',
    {
      schema: {
        summary: 'Create a new account',
        description: 'Create a new account',
        tags: ['auth'],
        body: z.object({
          name: z.string(),
          username: z
            .string()
            .min(3)
            .regex(/^[a-zA-Z0-9_]+$/),
          password: z.string().min(4),
        }),
      },
    },
    async (request, reply) => {
      const { name, username, password } = request.body

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
        },
      })

      await logAction({
        userId: user.id,
        action: 'CREATE',
        resource: 'AUTH',
        resourceId: user.id,
        details: `Criou a própria conta com nome de usuário: ${username}`,
      })

      return reply.status(201).send()
    }
  )
}
