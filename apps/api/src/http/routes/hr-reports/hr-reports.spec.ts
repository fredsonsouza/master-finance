import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequestError } from '../_errors/bad-request-error'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { createHrReport } from './create-hr-report'
import { deleteHrReport } from './delete-hr-report'
import { getHrReport } from './get-hr-report'
import { getHrReports } from './get-hr-reports'
import { updateHrReport } from './update-hr-report'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    hrReport: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

describe('HR Work Reports Unit Tests', () => {
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
      if (error instanceof ResourceNotFoundError) {
        return reply.status(404).send({ message: error.message })
      }
      if (error instanceof BadRequestError || error.statusCode === 400) {
        return reply.status(400).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(createHrReport)
    await app.register(getHrReports)
    await app.register(getHrReport)
    await app.register(updateHrReport)
    await app.register(deleteHrReport)
  })

  test('should allow EMPLOYEE to create a draft report with free text sector', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    const date = new Date('2026-08-29')
    vi.mocked(prisma.hrReport.create).mockResolvedValueOnce({
      id: '523e4567-e89b-12d3-a456-426614174005',
      title: 'Relatório Diário Recepção',
      content: 'Atendimentos normais no dia de hoje.',
      reportDate: date,
      status: 'DRAFT',
      sentAt: null,
      userId: '123e4567-e89b-12d3-a456-426614174000',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
      sector: 'Recepção e Triagem',
      createdAt: date,
      updatedAt: date,
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/hr-reports',
      payload: {
        title: 'Relatório Diário Recepção',
        content: 'Atendimentos normais no dia de hoje.',
        reportDate: '2026-08-29T00:00:00.000Z',
        status: 'DRAFT',
        sector: 'Recepção e Triagem',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().report.status).toBe('DRAFT')
    expect(response.json().report.sector).toBe('Recepção e Triagem')
    expect(response.json().report.sentAt).toBeNull()
  })

  test('should isolate reports by userId when user is EMPLOYEE', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    } as any)

    vi.mocked(prisma.hrReport.count)
      .mockResolvedValueOnce(1) // totalCount
      .mockResolvedValueOnce(0) // sentCount
      .mockResolvedValueOnce(1) // draftCount

    vi.mocked(prisma.hrReport.findMany).mockResolvedValueOnce([
      {
        id: '523e4567-e89b-12d3-a456-426614174005',
        title: 'Relatório Diário Recepção',
        content: 'Conteúdo',
        reportDate: new Date('2026-08-29'),
        status: 'DRAFT',
        sentAt: null,
        createdAt: new Date('2026-08-29'),
        updatedAt: new Date('2026-08-29'),
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'João Silva',
          username: 'joao',
          role: 'EMPLOYEE',
        },
        unit: null,
        sector: 'Recepção',
      },
    ] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/hr-reports',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().summary).toEqual({
      totalCount: 1,
      sentCount: 0,
      draftCount: 1,
    })
    expect(prisma.hrReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: '123e4567-e89b-12d3-a456-426614174000',
        }),
      })
    )
  })

  test('should allow ADMIN to list all reports across all users and units', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
    } as any)

    vi.mocked(prisma.hrReport.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)

    vi.mocked(prisma.hrReport.findMany).mockResolvedValueOnce([])

    const response = await app.inject({
      method: 'GET',
      url: '/hr-reports',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().summary).toEqual({
      totalCount: 0,
      sentCount: 0,
      draftCount: 0,
    })
    expect(prisma.hrReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      })
    )
  })

  test('should allow user to update their own draft and submit it as SENT', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
    } as any)

    vi.mocked(prisma.hrReport.findUnique).mockResolvedValueOnce({
      id: '523e4567-e89b-12d3-a456-426614174005',
      title: 'Relatório',
      content: 'Rascunho inicial',
      reportDate: new Date('2026-08-29'),
      status: 'DRAFT',
      sentAt: null,
      userId: '123e4567-e89b-12d3-a456-426614174000',
      sector: 'Recepção',
    } as any)

    const sentDate = new Date()
    vi.mocked(prisma.hrReport.update).mockResolvedValueOnce({
      id: '523e4567-e89b-12d3-a456-426614174005',
      title: 'Relatório Final',
      content: 'Conteúdo finalizado e enviado',
      reportDate: new Date('2026-08-29'),
      status: 'SENT',
      sentAt: sentDate,
      userId: '123e4567-e89b-12d3-a456-426614174000',
      unitId: null,
      sector: 'Recepção',
      createdAt: new Date('2026-08-29'),
      updatedAt: sentDate,
    } as any)

    const response = await app.inject({
      method: 'PUT',
      url: '/hr-reports/523e4567-e89b-12d3-a456-426614174005',
      payload: {
        title: 'Relatório Final',
        content: 'Conteúdo finalizado e enviado',
        status: 'SENT',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().report.status).toBe('SENT')
    expect(prisma.hrReport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SENT',
          sentAt: expect.any(Date),
        }),
      })
    )
  })

  test('should prevent non-admin from modifying a report that was already SENT', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE',
    } as any)

    vi.mocked(prisma.hrReport.findUnique).mockResolvedValueOnce({
      id: '523e4567-e89b-12d3-a456-426614174005',
      title: 'Relatório Fechado',
      content: 'Conteúdo',
      reportDate: new Date('2026-08-29'),
      status: 'SENT',
      sentAt: new Date('2026-08-29'),
      userId: '123e4567-e89b-12d3-a456-426614174000',
    } as any)

    const response = await app.inject({
      method: 'PUT',
      url: '/hr-reports/523e4567-e89b-12d3-a456-426614174005',
      payload: {
        title: 'Tentativa de Alteração',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      message: 'Relatórios já enviados ao RH não podem ser alterados.',
    })
  })
})
