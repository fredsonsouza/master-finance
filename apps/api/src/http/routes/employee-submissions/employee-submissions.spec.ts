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
import { createEmployeeSubmission } from './create-employee-submission'
import { deleteEmployeeSubmission } from './delete-employee-submission'
import { getEmployeeSubmissionFile } from './get-employee-submission-file'
import { getEmployeeSubmissions } from './get-employee-submissions'
import { updateEmployeeSubmissionStatus } from './update-employee-submission-status'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    employee: {
      findUnique: vi.fn(),
    },
    employeeDocumentSubmission: {
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

const VALID_PDF_BUFFER = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n%%EOF\n'.repeat(
    2
  )
)
const VALID_PDF_DATA_URI = `data:application/pdf;base64,${VALID_PDF_BUFFER.toString('base64')}`

describe('Employee Document Submissions (PDF Uploads) Unit Tests', () => {
  let app: ReturnType<typeof fastify>
  let currentSub = '11111111-1111-4111-8111-111111111111'

  const hrUserId = '11111111-1111-4111-8111-111111111111'
  const collaboratorUserId = '22222222-2222-4222-8222-222222222222'
  const otherUserId = '33333333-3333-4333-8333-333333333333'
  const employeeId = '44444444-4444-4444-8444-444444444444'
  const otherEmployeeId = '55555555-5555-4555-8555-555555555555'
  const submissionId = '66666666-6666-4666-8666-666666666666'

  beforeEach(async () => {
    vi.clearAllMocks()
    currentSub = collaboratorUserId

    app = fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    app.decorateRequest('jwtVerify', async () => ({ sub: currentSub }))

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

    await app.register(createEmployeeSubmission)
    await app.register(getEmployeeSubmissions)
    await app.register(getEmployeeSubmissionFile)
    await app.register(updateEmployeeSubmissionStatus)
    await app.register(deleteEmployeeSubmission)
  })

  test('allows regular collaborator to submit a medical certificate PDF and forces PENDING status on their own profile', async () => {
    currentSub = collaboratorUserId

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: collaboratorUserId,
      role: 'EMPLOYEE',
      permissions: [],
      unitId: null,
      employee: { id: employeeId },
    } as any)

    vi.mocked(prisma.employee.findUnique).mockResolvedValueOnce({
      id: employeeId,
      fullName: 'Maria Silva',
      unitId: null,
    } as any)

    vi.mocked(prisma.employeeDocumentSubmission.create).mockResolvedValueOnce({
      id: submissionId,
      category: 'MEDICAL_CERTIFICATE',
      title: 'Atestado Médico - 2 dias',
      status: 'PENDING',
      fileName: 'atestado_maria.pdf',
      mimeType: 'application/pdf',
      sizeBytes: VALID_PDF_BUFFER.byteLength,
      daysCount: 2,
      cid: 'J06',
    } as any)

    const res = await app.inject({
      method: 'POST',
      url: '/employee-submissions',
      payload: {
        employeeId: otherEmployeeId, // regular employee must NOT be able to target someone else
        status: 'APPROVED', // regular employee must NOT be able to self-approve
        category: 'MEDICAL_CERTIFICATE',
        title: 'Atestado Médico - 2 dias',
        description: 'Consulta de urgência no pronto-socorro',
        startDate: '2026-11-25',
        daysCount: 2,
        cid: 'j06',
        fileName: 'atestado maria.pdf',
        mimeType: 'application/pdf',
        fileData: VALID_PDF_DATA_URI,
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().submission.status).toBe('PENDING')

    expect(prisma.employeeDocumentSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employeeId,
          submittedById: collaboratorUserId,
          status: 'PENDING',
          cid: 'J06',
          daysCount: 2,
          fileName: 'atestado_maria.pdf',
          mimeType: 'application/pdf',
          sizeBytes: VALID_PDF_BUFFER.byteLength,
        }),
      })
    )
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1)
  })

  test('rejects spoofed non-PDF binary disguised as .pdf with 400', async () => {
    currentSub = collaboratorUserId

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: collaboratorUserId,
      role: 'EMPLOYEE',
      permissions: [],
      unitId: null,
      employee: { id: employeeId },
    } as any)

    vi.mocked(prisma.employee.findUnique).mockResolvedValueOnce({
      id: employeeId,
      fullName: 'Maria Silva',
      unitId: null,
    } as any)

    const spoofed = Buffer.from(
      'not a pdf payload at all '.repeat(10)
    ).toString('base64')

    const res = await app.inject({
      method: 'POST',
      url: '/employee-submissions',
      payload: {
        category: 'OTHER',
        title: 'Comprovante de Residência',
        fileName: 'comprovante.pdf',
        mimeType: 'application/pdf',
        fileData: `data:application/pdf;base64,${spoofed}`,
      },
    })

    expect(res.statusCode).toBe(400)
    expect(prisma.employeeDocumentSubmission.create).not.toHaveBeenCalled()
  })

  test('scopes GET /employee-submissions for regular collaborators and returns summary counters', async () => {
    currentSub = collaboratorUserId

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: collaboratorUserId,
      role: 'EMPLOYEE',
      permissions: [],
      unitId: null,
      employee: { id: employeeId },
    } as any)

    vi.mocked(prisma.employeeDocumentSubmission.count)
      .mockResolvedValueOnce(2) // total
      .mockResolvedValueOnce(1) // pending
      .mockResolvedValueOnce(0) // under review
      .mockResolvedValueOnce(1) // approved
      .mockResolvedValueOnce(0) // rejected

    vi.mocked(prisma.employeeDocumentSubmission.findMany).mockResolvedValueOnce(
      [
        {
          id: submissionId,
          category: 'MEDICAL_CERTIFICATE',
          title: 'Atestado Médico',
          status: 'PENDING',
          fileName: 'atestado.pdf',
          sizeBytes: VALID_PDF_BUFFER.byteLength,
        },
      ] as any
    )

    const res = await app.inject({
      method: 'GET',
      url: '/employee-submissions',
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.summary).toEqual({
      totalCount: 2,
      pendingCount: 1,
      underReviewCount: 0,
      approvedCount: 1,
      rejectedCount: 0,
    })
    expect(body.submissions).toHaveLength(1)

    const findManyCall = vi.mocked(prisma.employeeDocumentSubmission.findMany)
      .mock.calls[0][0] as any
    expect(findManyCall.where.OR).toEqual([
      { submittedById: collaboratorUserId },
      { employeeId },
    ])
    // Ensure raw binary file content is never selected on list
    expect(findManyCall.include.file).toBeUndefined()
  })

  test('allows owner and HR to download PDF file, but blocks unauthorized third-party users', async () => {
    const storedSubmission = {
      id: submissionId,
      employeeId,
      submittedById: collaboratorUserId,
      fileName: 'atestado_maria.pdf',
      employee: { id: employeeId, userId: collaboratorUserId },
      file: { content: Uint8Array.from(VALID_PDF_BUFFER) },
    }

    // 1. Third party -> 401
    currentSub = otherUserId
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: otherUserId,
      role: 'EMPLOYEE',
      permissions: [],
      unitId: null,
      employee: { id: otherEmployeeId },
    } as any)
    vi.mocked(
      prisma.employeeDocumentSubmission.findUnique
    ).mockResolvedValueOnce(storedSubmission as any)

    const blockedRes = await app.inject({
      method: 'GET',
      url: `/employee-submissions/${submissionId}/file`,
    })
    expect(blockedRes.statusCode).toBe(401)

    // 2. Owner -> 200 inline PDF
    currentSub = collaboratorUserId
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: collaboratorUserId,
      role: 'EMPLOYEE',
      permissions: [],
      unitId: null,
      employee: { id: employeeId },
    } as any)
    vi.mocked(
      prisma.employeeDocumentSubmission.findUnique
    ).mockResolvedValueOnce(storedSubmission as any)

    const ownerRes = await app.inject({
      method: 'GET',
      url: `/employee-submissions/${submissionId}/file`,
    })
    expect(ownerRes.statusCode).toBe(200)
    expect(ownerRes.headers['content-type']).toBe('application/pdf')
    expect(ownerRes.headers['content-disposition']).toBe(
      'inline; filename="atestado_maria.pdf"'
    )
    expect(ownerRes.headers['cache-control']).toBe('private, no-store')
    expect(ownerRes.rawPayload.equals(VALID_PDF_BUFFER)).toBe(true)

    // 3. HR manager with ?download=1 -> 200 attachment PDF
    currentSub = hrUserId
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: hrUserId,
      role: 'EMPLOYEE',
      permissions: ['employees:manage'],
      unitId: null,
      employee: null,
    } as any)
    vi.mocked(
      prisma.employeeDocumentSubmission.findUnique
    ).mockResolvedValueOnce(storedSubmission as any)

    const hrRes = await app.inject({
      method: 'GET',
      url: `/employee-submissions/${submissionId}/file?download=1`,
    })
    expect(hrRes.statusCode).toBe(200)
    expect(hrRes.headers['content-disposition']).toBe(
      'attachment; filename="atestado_maria.pdf"'
    )
  })

  test('allows HR to approve or reject with mandatory reason, and blocks non-HR users', async () => {
    // 1. Non-HR -> 401
    currentSub = collaboratorUserId
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: collaboratorUserId,
      role: 'EMPLOYEE',
      permissions: [],
      unitId: null,
    } as any)

    const forbiddenRes = await app.inject({
      method: 'PATCH',
      url: `/employee-submissions/${submissionId}/status`,
      payload: { status: 'APPROVED' },
    })
    expect(forbiddenRes.statusCode).toBe(401)

    // 2. HR rejecting without reason -> 400
    currentSub = hrUserId
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: hrUserId,
      role: 'EMPLOYEE',
      permissions: ['employees:manage'],
      unitId: null,
    } as any)
    vi.mocked(
      prisma.employeeDocumentSubmission.findUnique
    ).mockResolvedValueOnce({
      id: submissionId,
      title: 'Atestado Médico',
      fileName: 'atestado.pdf',
      status: 'PENDING',
      employee: { fullName: 'Maria Silva' },
    } as any)

    const noReasonRes = await app.inject({
      method: 'PATCH',
      url: `/employee-submissions/${submissionId}/status`,
      payload: { status: 'REJECTED', rejectionReason: '  ' },
    })
    expect(noReasonRes.statusCode).toBe(400)

    // 3. HR rejecting with valid reason -> 200
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: hrUserId,
      role: 'EMPLOYEE',
      permissions: ['employees:manage'],
      unitId: null,
    } as any)
    vi.mocked(
      prisma.employeeDocumentSubmission.findUnique
    ).mockResolvedValueOnce({
      id: submissionId,
      title: 'Atestado Médico',
      fileName: 'atestado.pdf',
      status: 'PENDING',
      employee: { fullName: 'Maria Silva' },
    } as any)
    vi.mocked(prisma.employeeDocumentSubmission.update).mockResolvedValueOnce({
      id: submissionId,
      title: 'Atestado Médico',
      fileName: 'atestado.pdf',
      status: 'REJECTED',
      rejectionReason: 'PDF ilegível, reenvie com carimbo e CRM visíveis.',
    } as any)

    const rejectedRes = await app.inject({
      method: 'PATCH',
      url: `/employee-submissions/${submissionId}/status`,
      payload: {
        status: 'REJECTED',
        rejectionReason: 'PDF ilegível, reenvie com carimbo e CRM visíveis.',
      },
    })
    expect(rejectedRes.statusCode).toBe(200)
    expect(rejectedRes.json().submission.status).toBe('REJECTED')
    expect(prisma.employeeDocumentSubmission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'REJECTED',
          rejectionReason: 'PDF ilegível, reenvie com carimbo e CRM visíveis.',
          reviewedById: hrUserId,
        }),
      })
    )
  })

  test('allows owner to delete only PENDING submissions and HR to delete any', async () => {
    // 1. Owner deleting APPROVED -> 401
    currentSub = collaboratorUserId
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: collaboratorUserId,
      role: 'EMPLOYEE',
      permissions: [],
      unitId: null,
    } as any)
    vi.mocked(
      prisma.employeeDocumentSubmission.findUnique
    ).mockResolvedValueOnce({
      id: submissionId,
      title: 'Atestado Médico',
      fileName: 'atestado.pdf',
      status: 'APPROVED',
      submittedById: collaboratorUserId,
      employee: { fullName: 'Maria Silva' },
    } as any)

    const blockedDelete = await app.inject({
      method: 'DELETE',
      url: `/employee-submissions/${submissionId}`,
    })
    expect(blockedDelete.statusCode).toBe(401)

    // 2. Owner deleting PENDING -> 204
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: collaboratorUserId,
      role: 'EMPLOYEE',
      permissions: [],
      unitId: null,
    } as any)
    vi.mocked(
      prisma.employeeDocumentSubmission.findUnique
    ).mockResolvedValueOnce({
      id: submissionId,
      title: 'Atestado Médico',
      fileName: 'atestado.pdf',
      status: 'PENDING',
      submittedById: collaboratorUserId,
      employee: { fullName: 'Maria Silva' },
    } as any)
    vi.mocked(prisma.employeeDocumentSubmission.delete).mockResolvedValueOnce(
      {} as any
    )

    const okDelete = await app.inject({
      method: 'DELETE',
      url: `/employee-submissions/${submissionId}`,
    })
    expect(okDelete.statusCode).toBe(204)
  })
})
