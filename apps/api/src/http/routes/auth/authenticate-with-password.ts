import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'

export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate with e-mail & password',
        security: [
          {
            bearerAuth: [],
          },
        ],
        body: z.object({
          username: z.string(),
          password: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
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
        throw new BadRequestError('Invalid credentials')
      }

      if (userFromUsername.username === null) {
        throw new ResourceNotFoundError('User does not have a username')
      }

      if (userFromUsername.password_hash === null) {
        throw new BadRequestError(
          'User does not have a password, use social login'
        )
      }

      const isPasswordValid = await compare(
        password,
        userFromUsername.password_hash
      )

      if (!isPasswordValid) {
        throw new BadRequestError('Invalid credentials')
      }

      const token = await reply.jwtSign(
        { sub: userFromUsername.id },
        {
          sign: {
            sub: userFromUsername.id,
            expiresIn: '7d',
          },
        }
      )

      return reply.status(201).send({ token })
    }
  )
}
