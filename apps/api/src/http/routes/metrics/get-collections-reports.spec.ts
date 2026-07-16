import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getCollectionsReports } from './get-collections-reports'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    collection: {
      findMany: vi.fn(),
    },
  },
}))

describe('Get Collections Reports Unit Test', () => {
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

    await app.register(getCollectionsReports)
  })

  test('should return report data for a FISCAL', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'FISCAL',
    } as any)

    vi.mocked(prisma.collection.findMany).mockResolvedValueOnce([
      {
        requestDate: new Date('2026-05-15T12:00:00.000Z'),
        exams: ['HEMO', 'GLIC'],
        collector: { name: 'Collector John' },
      },
      {
        requestDate: new Date('2026-05-20T12:00:00.000Z'),
        exams: ['HEMO', 'URI'],
        collector: { name: 'Collector Jane' },
      },
      {
        requestDate: new Date('2026-06-10T12:00:00.000Z'),
        exams: ['GLIC'],
        collector: { name: 'Collector John' },
      },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/metrics/reports/collections?month=2026-05',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      monthlyHistory: [
        { month: '2026-05', count: 2 },
        { month: '2026-06', count: 1 },
      ],
      collectorRanking: [
        { name: 'Collector John', count: 1 },
        { name: 'Collector Jane', count: 1 },
      ],
      topExams: [
        { name: 'HEMO', count: 2 },
        { name: 'GLIC', count: 1 },
        { name: 'URI', count: 1 },
      ],
    })
  })

  test('should block EMPLOYEE from viewing collections reports', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/metrics/reports/collections',
    })

    expect(response.statusCode).toBe(401)
  })
})
