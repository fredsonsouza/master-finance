import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate with e-mail & password',
        body: z.object({
          username: z.string(),
          password: z.string(),
        }),
        response: {
          201: z.string(),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { username, password } = request.body

      const userFromUsername = await prisma.user.findUnique({
        where: {
          username,
        },
      })

      if (!userFromUsername) {
        return reply.status(400).send({ message: 'Invalid credentials.' })
      }

      if (userFromUsername.password_hash === null) {
        return reply
          .status(400)
          .send({ message: 'User does not have a password, use social login.' })
      }

      const isPasswordValid = await compare(
        password,
        userFromUsername.password_hash
      )

      if (!isPasswordValid) {
        return reply.status(400).send({ message: 'Invalid credentials.' })
      }

      const token = await reply.jwtSign(
        {},
        {
          sign: {
            expiresIn: '7d',
          },
        }
      )

      return reply.status(201).send(token)
    }
  )
}
