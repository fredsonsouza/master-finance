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

      let userFromUsername = await prisma.user.findUnique({
        where: {
          username,
        },
      })

      let employeeStatus: 'ACTIVE' | 'INACTIVE' | null = null

      if (userFromUsername) {
        const inlineEmployee = (
          userFromUsername as unknown as {
            employee?: { status?: 'ACTIVE' | 'INACTIVE' } | null
          }
        ).employee
        if (inlineEmployee?.status) {
          employeeStatus = inlineEmployee.status
        } else if (prisma.employee?.findUnique) {
          try {
            const linkedEmployee = await prisma.employee.findUnique({
              where: { userId: userFromUsername.id },
              select: { status: true },
            })
            if (linkedEmployee) {
              employeeStatus = linkedEmployee.status
            }
          } catch {
            // Ignore if employees table/client is not migrated yet
          }
        }
      } else if (prisma.employee?.findUnique) {
        try {
          const employeeRecord = await prisma.employee.findUnique({
            where: {
              registrationNumber: username.trim().toUpperCase(),
            },
            include: {
              user: true,
            },
          })

          if (employeeRecord?.user) {
            userFromUsername = employeeRecord.user
            employeeStatus = employeeRecord.status
          }
        } catch {
          // Ignore if employees table/client is not migrated yet
        }
      }

      if (!userFromUsername) {
        throw new BadRequestError('Invalid credentials')
      }

      if (employeeStatus === 'INACTIVE') {
        throw new BadRequestError(
          'Colaborador inativo. Entre em contato com o setor de RH.'
        )
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
