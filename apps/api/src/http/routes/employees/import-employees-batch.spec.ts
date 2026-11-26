import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { importEmployeesBatch } from './import-employees-batch'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    employee: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

describe('Employees Batch PDF Import Unit Tests', () => {
  let app: ReturnType<typeof fastify>
  const adminId = '123e4567-e89b-12d3-a456-426614174000'
  const employeeUserId = '223e4567-e89b-12d3-a456-426614174001'

  beforeEach(async () => {
    vi.clearAllMocks()
    app = fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    app.decorateRequest(
      'jwtVerify',
      vi.fn().mockResolvedValue({ sub: adminId })
    )

    app.setErrorHandler((error: any, _request: any, reply: any) => {
      if (error instanceof UnauthorizedError) {
        return reply.status(401).send({ message: error.message })
      }
      if (error instanceof BadRequestError || error.statusCode === 400) {
        return reply.status(400).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(importEmployeesBatch)
  })

  test('blocks non-ADMIN users from check-cpfs and import-batch', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: employeeUserId,
      role: 'EMPLOYEE',
      permissions: ['MANAGE_EMPLOYEES'],
    })

    const res1 = await app.inject({
      method: 'POST',
      url: '/employees/import-batch/check-cpfs',
      payload: { cpfs: ['123.456.789-01'] },
    })
    expect(res1.statusCode).toBe(401)

    const res2 = await app.inject({
      method: 'POST',
      url: '/employees/import-batch',
      payload: {
        employees: [
          {
            fullName: 'Maria Silva',
            cpf: '12345678901',
            admissionDate: '2024-01-10',
            roleTitle: 'Recepcionista',
            salary: 2000,
          },
        ],
      },
    })
    expect(res2.statusCode).toBe(401)
  })

  test('returns existing normalized CPFs for ADMIN', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: adminId,
      role: 'ADMIN',
      permissions: [],
    })
    ;(prisma.employee.findMany as any).mockResolvedValue([
      { cpf: '12345678901' },
    ])

    const res = await app.inject({
      method: 'POST',
      url: '/employees/import-batch/check-cpfs',
      payload: {
        cpfs: ['123.456.789-01', '987.654.321-00', 'invalid'],
      },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ existingCpfs: ['12345678901'] })
  })

  test('imports active and terminated employees, skips duplicates, keeps unit/department/user null', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: adminId,
      role: 'ADMIN',
      permissions: [],
    })
    ;(prisma.employee.findMany as any)
      .mockResolvedValueOnce([
        {
          id: '99999999-9999-4999-8999-999999999999',
          cpf: '11122233344',
          registrationNumber: 'MASTER-JES0001',
        },
      ]) // existing CPFs
      .mockResolvedValueOnce([{ registrationNumber: 'MASTER-EX0001' }]) // existing reg numbers

    let createCallIndex = 0
    ;(prisma.employee.create as any).mockImplementation(
      async ({ data }: any) => {
        createCallIndex += 1
        return {
          id: `00000000-0000-4000-8000-00000000000${createCallIndex}`,
          registrationNumber: data.registrationNumber,
          fullName: data.fullName,
          cpf: data.cpf,
          status: data.status,
        }
      }
    )

    const res = await app.inject({
      method: 'POST',
      url: '/employees/import-batch',
      payload: {
        skipExisting: true,
        employees: [
          {
            fullName: 'Já Existe Silva',
            cpf: '111.222.333-44',
            admissionDate: '2022-03-01',
            roleTitle: 'Atendente',
            salary: 1800,
          },
          {
            fullName: 'Ana Paula Costa',
            cpf: '222.333.444-55',
            admissionDate: '2023-05-15',
            roleTitle: 'Técnica em Enfermagem',
            salary: 2650.5,
            cboCode: '3222-05',
            workSchedule: [
              {
                day: 'Seg',
                type: 'Normal',
                entry: '07:00',
                breakStart: '12:00',
                breakEnd: '13:00',
                exit: '16:00',
              },
            ],
          },
          {
            fullName: 'Carlos Eduardo Lima',
            cpf: '333.444.555-66',
            admissionDate: '2021-01-10',
            roleTitle: 'Auxiliar Administrativo',
            salary: 1900,
            terminationDate: '2024-08-20',
            terminationType: 'Dispensa sem justa causa',
          },
          {
            fullName: 'Data Inválida',
            cpf: '444.555.666-77',
            admissionDate: 'invalid-date',
            roleTitle: 'Auxiliar',
            salary: 1500,
          },
        ],
      },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.importedCount).toBe(2)
    expect(body.skippedCount).toBe(1)
    expect(body.errorCount).toBe(1)
    expect(body.imported[0].status).toBe('ACTIVE')
    expect(body.imported[1].status).toBe('INACTIVE')
    expect(body.skipped[0].cpf).toBe('11122233344')
    expect(body.errors[0].cpf).toBe('44455566677')

    const firstCreateArg = (prisma.employee.create as any).mock.calls[0][0].data
    expect(firstCreateArg.unitId).toBeNull()
    expect(firstCreateArg.departmentId).toBeNull()
    expect(firstCreateArg.userId).toBeNull()
    expect(firstCreateArg.status).toBe('ACTIVE')

    const secondCreateArg = (prisma.employee.create as any).mock.calls[1][0]
      .data
    expect(secondCreateArg.status).toBe('INACTIVE')
    expect(secondCreateArg.terminationDate).toBeInstanceOf(Date)
    expect(secondCreateArg.terminationType).toBe('Dispensa sem justa causa')

    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1)
  })

  test('updates existing employees by CPF when updateExisting is true while preserving registration/unit/user', async () => {
    const existingId = '99999999-9999-4999-8999-999999999999'
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: adminId,
      role: 'ADMIN',
      permissions: [],
    })
    ;(prisma.employee.findMany as any)
      .mockResolvedValueOnce([
        {
          id: existingId,
          cpf: '00822555204',
          registrationNumber: 'MASTER-FSS0001',
        },
      ])
      .mockResolvedValueOnce([{ registrationNumber: 'MASTER-FSS0001' }])
    ;(prisma.employee.update as any).mockResolvedValueOnce({
      id: existingId,
      registrationNumber: 'MASTER-FSS0001',
      fullName: 'FREDSON SILVA DE SOUZA',
      cpf: '00822555204',
      status: 'ACTIVE',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/employees/import-batch',
      payload: {
        updateExisting: true,
        employees: [
          {
            fullName: 'FREDSON SILVA DE SOUZA',
            cpf: '008.225.552-04',
            admissionDate: '2026-02-09',
            roleTitle: 'GESTOR(A) DE UNIDADE',
            salary: 2500,
            raceColor: 'Parda',
            gender: 'Masculino',
            educationLevel: 'Superior Completo',
            fatherName: 'JOZEMAR LOPES DE SOUZA',
            motherName: 'ELISANGELA SILVA DE SOUZA',
          },
        ],
      },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.importedCount).toBe(0)
    expect(body.updatedCount).toBe(1)
    expect(body.skippedCount).toBe(0)
    expect(body.updated[0].registrationNumber).toBe('MASTER-FSS0001')

    const updateData = (prisma.employee.update as any).mock.calls[0][0].data
    expect(updateData.raceColor).toBe('Parda')
    expect(updateData.gender).toBe('Masculino')
    expect(updateData.educationLevel).toBe('Superior Completo')
    expect(updateData.fatherName).toBe('JOZEMAR LOPES DE SOUZA')
    expect(updateData.motherName).toBe('ELISANGELA SILVA DE SOUZA')
    expect(updateData.registrationNumber).toBeUndefined()
    expect(updateData.unitId).toBeUndefined()
    expect(updateData.departmentId).toBeUndefined()
    expect(updateData.userId).toBeUndefined()
  })
})
