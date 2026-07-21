import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getItems(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/items',
      {
        schema: {
          tags: ['items'],
          summary: 'Get all items',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            sectorId: z.uuid().optional(),
          }),
          response: {
            200: z.object({
              items: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  description: z.string().nullable(),
                  quantity: z.number().int(),
                  sectorId: z.string().uuid().nullable(),
                  createdAt: z.date(),
                  updatedAt: z.date(),
                  sector: z
                    .object({
                      id: z.string().uuid(),
                      name: z.string(),
                    })
                    .nullable()
                    .optional(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const requestingUser = await prisma.user.findUnique({
          where: { id: userId },
        })

        if (!requestingUser) {
          throw new UnauthorizedError()
        }

        const { sectorId } = request.query

        const items = await prisma.item.findMany({
          take: 100, // Limita a 100 para não estourar a memória no acesso global
          where: {
            sectorId,
          },
          include: {
            sector: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return reply.status(200).send({ items })
      }
    )
}
