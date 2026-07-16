import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getDailyFlow } from './get-daily-flow'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
  },
}))

describe('Get Daily Flow Metrics Unit Test', () => {
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

    await app.register(getDailyFlow)
  })

  test('should return daily flow correctly mapped for a MANAGER', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER',
    } as any)

    vi.mocked(prisma.transaction.findMany).mockResolvedValueOnce([
      { type: 'ENTRY', value: 150, date: new Date('2026-05-02T12:00:00Z') },
      { type: 'EXIT', value: 50, date: new Date('2026-05-02T14:00:00Z') },
      { type: 'ENTRY', value: 300, date: new Date('2026-05-15T10:00:00Z') },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/metrics/daily-flow?month=2026-05',
    })

    expect(response.statusCode).toBe(200)

    const flow = response.json().flow
    expect(flow.length).toBe(31) // May has 31 days

    const day02 = flow.find((f: any) => f.day === '02')
    expect(day02).toEqual({ day: '02', entries: 150, exits: 50 })

    const day15 = flow.find((f: any) => f.day === '15')
    expect(day15).toEqual({ day: '15', entries: 300, exits: 0 })

    const day20 = flow.find((f: any) => f.day === '20')
    expect(day20).toEqual({ day: '20', entries: 0, exits: 0 }) // No transactions day
  })

  test('should block EMPLOYEE from viewing daily flow', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/metrics/daily-flow?month=2026-05',
    })

    expect(response.statusCode).toBe(401)
  })
})
