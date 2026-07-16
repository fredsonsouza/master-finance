import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { deleteSector } from './delete-sector'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    sector: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('Delete Sector Unit Test', () => {
  let app: ReturnType<typeof fastify>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    app.decorateRequest(
      'jwtVerify',
      vi.fn().mockResolvedValue({ sub: '123e4567-e89b-12d3-a456-426614174000' })
    )

    app.setErrorHandler((error: any, _request: any, reply: any) => {
      if (error instanceof UnauthorizedError) {
        return reply.status(401).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(deleteSector)
  })

  test('should successfully delete a sector', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
    } as any)

    vi.mocked(prisma.sector.findUnique).mockResolvedValueOnce({
      id: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.sector.delete).mockResolvedValue({} as any)

    const response = await app.inject({
      method: 'DELETE',
      url: '/sectors/223e4567-e89b-12d3-a456-426614174001',
    })

    expect(response.statusCode).toBe(204)
    expect(prisma.sector.delete).toHaveBeenCalledWith({
      where: { id: '223e4567-e89b-12d3-a456-426614174001' },
    })
  })
})
