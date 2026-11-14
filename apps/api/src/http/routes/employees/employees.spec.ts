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
import { changeEmployeeStatus } from './change-employee-status'
import { createEmployee } from './create-employee'
import { createEmployeeRequest } from './create-employee-request'
import { deleteEmployeeRequest } from './delete-employee-request'
import { getEmployee } from './get-employee'
import { getEmployeeRequests } from './get-employee-requests'
import { getEmployees } from './get-employees'
import { updateEmployee } from './update-employee'
import { updateEmployeeRequestStatus } from './update-employee-request-status'
import { verifyEmployeeDocument } from './verify-employee-document'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    employee: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    employeeRequest: {
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

describe('Employees & HR Document Requests Unit Tests', () => {
  let app: ReturnType<typeof fastify>
  const hrUserId = '123e4567-e89b-12d3-a456-426614174000'
  const employeeId = '323e4567-e89b-12d3-a456-426614174003'
  const requestId = '423e4567-e89b-12d3-a456-426614174004'

  beforeEach(async () => {
    vi.clearAllMocks()
    app = fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    app.decorateRequest(
      'jwtVerify',
      vi.fn().mockResolvedValue({ sub: hrUserId })
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

    await app.register(createEmployee)
    await app.register(getEmployees)
    await app.register(getEmployee)
    await app.register(updateEmployee)
    await app.register(changeEmployeeStatus)
    await app.register(createEmployeeRequest)
    await app.register(getEmployeeRequests)
    await app.register(updateEmployeeRequestStatus)
    await app.register(deleteEmployeeRequest)
    await app.register(verifyEmployeeDocument)
  })

  test('should allow HR user to create an employee and auto-generate MASTER-XXXX registrationNumber', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: hrUserId,
      role: 'HR',
      unitId: null,
    } as any)

    vi.mocked(prisma.employee.findUnique)
      .mockResolvedValueOnce(null) // CPF check
      .mockResolvedValueOnce(null) // registrationNumber collision check

    vi.mocked(prisma.employee.count).mockResolvedValueOnce(0)

    vi.mocked(prisma.employee.create).mockResolvedValueOnce({
      id: employeeId,
      registrationNumber: 'MASTER-JSS0001',
      fullName: 'João da Silva Santos',
      roleTitle: 'Biomédico',
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/employees',
      payload: {
        fullName: 'João da Silva Santos',
        cpf: '123.456.789-01',
        admissionDate: '2026-11-01T00:00:00.000Z',
        roleTitle: 'Biomédico',
        salary: 4500,
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      employeeId,
      registrationNumber: 'MASTER-JSS0001',
    })
  })

  test('should block non-HR/non-manager role from creating an employee', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: hrUserId,
      role: 'EMPLOYEE',
      unitId: null,
    } as any)

    const response = await app.inject({
      method: 'POST',
      url: '/employees',
      payload: {
        fullName: 'João da Silva Santos',
        cpf: '12345678901',
        admissionDate: '2026-11-01T00:00:00.000Z',
        roleTitle: 'Recepcionista',
        salary: 2200,
      },
    })

    expect(response.statusCode).toBe(401)
  })

  test('should allow HR to inactivate and activate an employee via PATCH /employees/:id/status', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: hrUserId,
      role: 'HR',
      unitId: null,
    } as any)

    vi.mocked(prisma.employee.findUnique).mockResolvedValueOnce({
      id: employeeId,
      fullName: 'João da Silva Santos',
      registrationNumber: 'MASTER-JSS0001',
      status: 'ACTIVE',
    } as any)

    vi.mocked(prisma.employee.update).mockResolvedValueOnce({
      id: employeeId,
      status: 'INACTIVE',
    } as any)

    const response = await app.inject({
      method: 'PATCH',
      url: `/employees/${employeeId}/status`,
      payload: {
        status: 'INACTIVE',
        terminationDate: '2026-11-14T00:00:00.000Z',
        terminationType: 'Sem justa causa',
      },
    })

    expect(response.statusCode).toBe(204)
    expect(prisma.employee.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: employeeId },
        data: expect.objectContaining({
          status: 'INACTIVE',
          terminationType: 'Sem justa causa',
        }),
      })
    )
  })

  test('should allow a regular EMPLOYEE to request a declaration (defaults to OPEN) and forbid requesting a WARNING', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: hrUserId,
      role: 'EMPLOYEE',
      unitId: null,
      employee: {
        id: employeeId,
        fullName: 'João da Silva Santos',
      },
    } as any)

    vi.mocked(prisma.employee.findUnique).mockResolvedValueOnce({
      id: employeeId,
      fullName: 'João da Silva Santos',
      unitId: null,
    } as any)

    vi.mocked(prisma.employeeRequest.create).mockResolvedValueOnce({
      id: requestId,
      employeeId,
      type: 'DECLARATION',
      subtype: 'DECLARACAO_VINCULO',
      title: 'Declaração de Vínculo Empregatício',
      description: 'Solicito declaração para faculdade.',
      status: 'OPEN',
      verificationCode: null,
    } as any)

    const openRes = await app.inject({
      method: 'POST',
      url: '/employee-requests',
      payload: {
        type: 'DECLARATION',
        subtype: 'DECLARACAO_VINCULO',
        title: 'Declaração de Vínculo Empregatício',
        description: 'Solicito declaração para faculdade.',
      },
    })

    expect(openRes.statusCode).toBe(201)
    expect(openRes.json().request.status).toBe('OPEN')

    // Now test that EMPLOYEE cannot issue a WARNING
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: hrUserId,
      role: 'EMPLOYEE',
      unitId: null,
      employee: { id: employeeId },
    } as any)

    const warningRes = await app.inject({
      method: 'POST',
      url: '/employee-requests',
      payload: {
        type: 'WARNING',
        subtype: 'ADVERTENCIA_ESCRITA',
        title: 'Advertência Disciplinar',
        description: 'Falta injustificada.',
      },
    })

    expect(warningRes.statusCode).toBe(401)
  })

  test('should allow HR to complete a request and generate electronic signature + SHA-256 hash', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: hrUserId,
      role: 'HR',
      unitId: null,
    } as any)

    vi.mocked(prisma.employeeRequest.findUnique).mockResolvedValueOnce({
      id: requestId,
      employeeId,
      type: 'DECLARATION',
      subtype: 'DECLARACAO_VINCULO',
      title: 'Declaração de Vínculo Empregatício',
      description: 'Declaro para os devidos fins...',
      status: 'IN_PROGRESS',
      verificationCode: null,
      employee: {
        id: employeeId,
        fullName: 'João da Silva Santos',
      },
    } as any)
    ;(prisma.employeeRequest.update as any).mockImplementationOnce(
      async (args: any) => ({
        id: requestId,
        ...args.data,
      })
    )

    const response = await app.inject({
      method: 'PATCH',
      url: `/employee-requests/${requestId}/status`,
      payload: {
        status: 'COMPLETED',
      },
    })

    expect(response.statusCode).toBe(200)
    const updated = response.json().request
    expect(updated.status).toBe('COMPLETED')
    expect(updated.verificationCode).toMatch(/^MC-DOC-\d{8}-[0-9A-F]{6}$/)
    expect(updated.contentHash).toMatch(/^[0-9a-f]{64}$/)
    expect(updated.issuedById).toBe(hrUserId)
  })

  test('should verify an authentic signed document via public endpoint GET /public/verify/:code', async () => {
    vi.mocked(prisma.employeeRequest.findUnique).mockResolvedValueOnce({
      id: requestId,
      status: 'COMPLETED',
      verificationCode: 'MC-DOC-20261114-A1B2C3',
      contentHash:
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      type: 'DECLARATION',
      subtype: 'DECLARACAO_VINCULO',
      title: 'Declaração de Vínculo Empregatício',
      signedAt: new Date('2026-11-14T12:00:00.000Z'),
      employee: {
        fullName: 'João da Silva Santos',
        registrationNumber: 'MASTER-JSS0001',
        cpf: '12345678901',
        roleTitle: 'Biomédico',
        employerName: 'GERENCIACLIN LTDA',
        employerCnpj: '59.162.564/0001-73',
      },
      issuedBy: {
        name: 'Maria RH',
        role: 'HR',
      },
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/public/verify/mc-doc-20261114-a1b2c3',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.valid).toBe(true)
    expect(body.document.verificationCode).toBe('MC-DOC-20261114-A1B2C3')
    expect(body.document.employee.cpfMasked).toBe('***.456.789-**')
    expect(body.document.employee.registrationNumber).toBe('MASTER-JSS0001')
  })
})
