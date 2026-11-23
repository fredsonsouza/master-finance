import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { formatRegistrationNumber } from '@/utils/employee-registration'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

const parseOptionalDate = (val?: string | null) => {
  if (!val) return null
  const trimmed = val.trim()
  if (!trimmed) return null
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T12:00:00.000Z`
    : trimmed
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

const importEmployeeItemSchema = z.object({
  esocialCode: z.string().nullable().optional(),
  employerName: z.string().nullable().optional(),
  employerCnpj: z.string().nullable().optional(),
  employerAddress: z.string().nullable().optional(),

  fullName: z.string().min(2),
  birthDate: z.string().nullable().optional(),
  birthPlace: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  maritalStatus: z.string().nullable().optional(),
  raceColor: z.string().nullable().optional(),
  fatherName: z.string().nullable().optional(),
  motherName: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  landlinePhone: z.string().nullable().optional(),
  mobilePhone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  beneficiaries: z.any().optional(),

  cpf: z.string().min(11),
  rgNumber: z.string().nullable().optional(),
  rgIssueDate: z.string().nullable().optional(),
  rgIssuer: z.string().nullable().optional(),
  ctpsNumber: z.string().nullable().optional(),
  ctpsSeries: z.string().nullable().optional(),
  ctpsIssueDate: z.string().nullable().optional(),
  ctpsState: z.string().nullable().optional(),
  voterRegistration: z.string().nullable().optional(),
  voterZone: z.string().nullable().optional(),
  voterSection: z.string().nullable().optional(),
  cnhNumber: z.string().nullable().optional(),
  cnhCategory: z.string().nullable().optional(),
  militaryDoc: z.string().nullable().optional(),
  militaryCategory: z.string().nullable().optional(),
  classCouncilNumber: z.string().nullable().optional(),

  admissionDate: z.string(),
  roleTitle: z.string().min(2),
  cboCode: z.string().nullable().optional(),
  salary: z.number().min(0).default(0),
  paymentType: z.string().nullable().optional(),
  workHoursSummary: z.string().nullable().optional(),
  breakHoursSummary: z.string().nullable().optional(),
  fgtsOptionDate: z.string().nullable().optional(),
  fgtsRectificationDate: z.string().nullable().optional(),
  fgtsBankAccount: z.string().nullable().optional(),
  pisRegistrationDate: z.string().nullable().optional(),
  pisNumber: z.string().nullable().optional(),
  pisBankName: z.string().nullable().optional(),
  pisBankNumber: z.string().nullable().optional(),
  pisBankBranch: z.string().nullable().optional(),
  pisBankAddress: z.string().nullable().optional(),

  workSchedule: z.any().optional(),
  generalObservations: z.string().nullable().optional(),

  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  terminationDate: z.string().nullable().optional(),
  terminationType: z.string().nullable().optional(),
})

/**
 * TEMPORARY MIGRATION ROUTES (ADMIN-ONLY)
 * Supports bulk PDF import of employee registration records (Fichas de Registro).
 * Safe to remove once initial HR migration is finished.
 */
export async function importEmployeesBatch(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/employees/import-batch/check-cpfs',
      {
        schema: {
          tags: ['employees'],
          summary:
            '[Temporary] Check which CPFs are already registered before batch import (ADMIN only)',
          security: [{ bearerAuth: [] }],
          body: z.object({
            cpfs: z.array(z.string()).max(500),
          }),
          response: {
            200: z.object({
              existingCpfs: z.array(z.string()),
            }),
          },
        },
      },
      async (request, reply) => {
        const currentUserId = await request.getCurrentUserId()
        const requestingUser = await prisma.user.findUnique({
          where: { id: currentUserId },
        })

        if (!requestingUser || requestingUser.role !== 'ADMIN') {
          throw new UnauthorizedError(
            'Apenas administradores podem utilizar a importação em lote de colaboradores.'
          )
        }

        const cleanedCpfs = Array.from(
          new Set(
            request.body.cpfs
              .map((cpf) => cpf.replace(/\D/g, ''))
              .filter((cpf) => cpf.length === 11)
          )
        )

        if (cleanedCpfs.length === 0) {
          return reply.status(200).send({ existingCpfs: [] })
        }

        const existing = await prisma.employee.findMany({
          where: { cpf: { in: cleanedCpfs } },
          select: { cpf: true },
        })

        return reply.status(200).send({
          existingCpfs: existing.map((item) => item.cpf),
        })
      }
    )

  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/employees/import-batch',
      {
        bodyLimit: 1_048_576, // 1 MB (chunks of up to 50 lightweight JSON records)
        schema: {
          tags: ['employees'],
          summary:
            '[Temporary] Bulk import employee records from parsed PDF data (ADMIN only)',
          security: [{ bearerAuth: [] }],
          body: z.object({
            skipExisting: z.boolean().default(true),
            employees: z.array(importEmployeeItemSchema).min(1).max(50),
          }),
          response: {
            200: z.object({
              importedCount: z.number(),
              skippedCount: z.number(),
              errorCount: z.number(),
              imported: z.array(
                z.object({
                  employeeId: z.string().uuid(),
                  registrationNumber: z.string(),
                  fullName: z.string(),
                  cpf: z.string(),
                  status: z.enum(['ACTIVE', 'INACTIVE']),
                })
              ),
              skipped: z.array(
                z.object({
                  fullName: z.string(),
                  cpf: z.string(),
                  reason: z.string(),
                })
              ),
              errors: z.array(
                z.object({
                  fullName: z.string(),
                  cpf: z.string(),
                  reason: z.string(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const currentUserId = await request.getCurrentUserId()
        const requestingUser = await prisma.user.findUnique({
          where: { id: currentUserId },
        })

        if (!requestingUser || requestingUser.role !== 'ADMIN') {
          throw new UnauthorizedError(
            'Apenas administradores podem utilizar a importação em lote de colaboradores.'
          )
        }

        const { employees, skipExisting } = request.body

        const normalizedCpfs = employees
          .map((e) => e.cpf.replace(/\D/g, ''))
          .filter((c) => c.length === 11)

        const existingRecords =
          normalizedCpfs.length > 0
            ? await prisma.employee.findMany({
                where: { cpf: { in: Array.from(new Set(normalizedCpfs)) } },
                select: { cpf: true },
              })
            : []

        const knownCpfs = new Set(existingRecords.map((r) => r.cpf))
        const existingRegs = await prisma.employee.findMany({
          select: { registrationNumber: true },
        })
        const usedRegistrationNumbers = new Set(
          existingRegs.map((r) => r.registrationNumber)
        )

        let seq = usedRegistrationNumbers.size + 1

        const imported: Array<{
          employeeId: string
          registrationNumber: string
          fullName: string
          cpf: string
          status: 'ACTIVE' | 'INACTIVE'
        }> = []
        const skipped: Array<{
          fullName: string
          cpf: string
          reason: string
        }> = []
        const errors: Array<{
          fullName: string
          cpf: string
          reason: string
        }> = []

        for (const item of employees) {
          const cleanCpf = item.cpf.replace(/\D/g, '')
          const fullName = item.fullName.trim()

          if (cleanCpf.length !== 11) {
            errors.push({
              fullName,
              cpf: item.cpf,
              reason: 'CPF inválido (deve conter 11 dígitos).',
            })
            continue
          }

          if (knownCpfs.has(cleanCpf)) {
            if (skipExisting) {
              skipped.push({
                fullName,
                cpf: cleanCpf,
                reason: 'CPF já cadastrado no sistema.',
              })
            } else {
              errors.push({
                fullName,
                cpf: cleanCpf,
                reason: 'CPF já cadastrado no sistema.',
              })
            }
            continue
          }

          const admissionDate = parseOptionalDate(item.admissionDate)
          if (!admissionDate) {
            errors.push({
              fullName,
              cpf: cleanCpf,
              reason: 'Data de admissão inválida ou ausente.',
            })
            continue
          }

          const terminationDate = parseOptionalDate(item.terminationDate)
          const resolvedStatus: 'ACTIVE' | 'INACTIVE' =
            item.status === 'INACTIVE' || terminationDate !== null
              ? 'INACTIVE'
              : 'ACTIVE'

          let registrationNumber = formatRegistrationNumber(fullName, seq)
          while (usedRegistrationNumbers.has(registrationNumber)) {
            seq += 1
            registrationNumber = formatRegistrationNumber(fullName, seq)
          }

          try {
            const created = await prisma.employee.create({
              data: {
                registrationNumber,
                esocialCode: item.esocialCode?.trim() || null,
                status: resolvedStatus,
                employerName: item.employerName?.trim() || 'GERENCIACLIN LTDA',
                employerCnpj: item.employerCnpj?.trim() || '59.162.564/0001-73',
                employerAddress:
                  item.employerAddress?.trim() ||
                  'Rua IVONE PINHEIRO, 1590, SALA 08, TANCREDO NEVES, BOA VISTA, RR',
                fullName,
                photoUrl: null,
                birthDate: parseOptionalDate(item.birthDate),
                birthPlace: item.birthPlace?.trim() || null,
                nationality: item.nationality?.trim() || 'Brasileira',
                maritalStatus: item.maritalStatus?.trim() || null,
                raceColor: item.raceColor?.trim() || null,
                fatherName: item.fatherName?.trim() || null,
                motherName: item.motherName?.trim() || null,
                address: item.address?.trim() || null,
                zipCode: item.zipCode?.trim() || null,
                landlinePhone: item.landlinePhone?.trim() || null,
                mobilePhone: item.mobilePhone?.trim() || null,
                email: item.email?.trim() || null,
                beneficiaries: item.beneficiaries ?? [],
                cpf: cleanCpf,
                rgNumber: item.rgNumber?.trim() || null,
                rgIssueDate: parseOptionalDate(item.rgIssueDate),
                rgIssuer: item.rgIssuer?.trim() || null,
                ctpsNumber: item.ctpsNumber?.trim() || null,
                ctpsSeries: item.ctpsSeries?.trim() || null,
                ctpsIssueDate: parseOptionalDate(item.ctpsIssueDate),
                ctpsState: item.ctpsState?.trim() || 'RR',
                voterRegistration: item.voterRegistration?.trim() || null,
                voterZone: item.voterZone?.trim() || null,
                voterSection: item.voterSection?.trim() || null,
                cnhNumber: item.cnhNumber?.trim() || null,
                cnhCategory: item.cnhCategory?.trim() || null,
                militaryDoc: item.militaryDoc?.trim() || null,
                militaryCategory: item.militaryCategory?.trim() || null,
                classCouncilNumber: item.classCouncilNumber?.trim() || null,
                admissionDate,
                roleTitle: item.roleTitle.trim(),
                cboCode: item.cboCode?.trim() || null,
                salary: item.salary ?? 0,
                paymentType: item.paymentType?.trim() || 'Mensal',
                workHoursSummary: item.workHoursSummary?.trim() || null,
                breakHoursSummary: item.breakHoursSummary?.trim() || null,
                fgtsOptionDate: parseOptionalDate(item.fgtsOptionDate),
                fgtsRectificationDate: parseOptionalDate(
                  item.fgtsRectificationDate
                ),
                fgtsBankAccount: item.fgtsBankAccount?.trim() || null,
                pisRegistrationDate: parseOptionalDate(
                  item.pisRegistrationDate
                ),
                pisNumber: item.pisNumber?.trim() || null,
                pisBankName: item.pisBankName?.trim() || null,
                pisBankNumber: item.pisBankNumber?.trim() || null,
                pisBankBranch: item.pisBankBranch?.trim() || null,
                pisBankAddress: item.pisBankAddress?.trim() || null,
                workSchedule: item.workSchedule ?? null,
                salaryRoleHistory: [],
                vacationsHistory: [],
                occupationalHealthHistory: [],
                unionContributions: [],
                generalObservations: item.generalObservations?.trim() || null,
                terminationDate,
                terminationType:
                  resolvedStatus === 'INACTIVE'
                    ? item.terminationType?.trim() || null
                    : null,
                unitId: null,
                sectorId: null,
                departmentId: null,
                userId: null,
                createdById: currentUserId,
              },
            })

            knownCpfs.add(cleanCpf)
            usedRegistrationNumbers.add(registrationNumber)
            seq += 1

            imported.push({
              employeeId: created.id,
              registrationNumber: created.registrationNumber,
              fullName: created.fullName,
              cpf: created.cpf,
              status: created.status,
            })
          } catch (err) {
            errors.push({
              fullName,
              cpf: cleanCpf,
              reason:
                err instanceof Error
                  ? err.message
                  : 'Erro ao persistir colaborador no banco de dados.',
            })
          }
        }

        if (imported.length > 0) {
          await logAction({
            userId: currentUserId,
            action: 'CREATE',
            resource: 'EMPLOYEE',
            details: `Importação em lote via PDF: ${imported.length} colaborador(es) cadastrado(s), ${skipped.length} ignorado(s), ${errors.length} erro(s).`,
          })
        }

        return reply.status(200).send({
          importedCount: imported.length,
          skippedCount: skipped.length,
          errorCount: errors.length,
          imported,
          skipped,
          errors,
        })
      }
    )
}
