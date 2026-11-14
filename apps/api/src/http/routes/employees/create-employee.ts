import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { formatRegistrationNumber } from '@/utils/employee-registration'
import { defineAbilityFor } from '@saas/auth'
import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

const parseOptionalDate = (val?: string | null) => {
  if (!val) return null
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function createEmployee(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/employees',
      {
        schema: {
          tags: ['employees'],
          summary: 'Create a new employee record (Ficha de Registro)',
          security: [{ bearerAuth: [] }],
          body: z.object({
            registrationNumber: z.string().optional(),
            esocialCode: z.string().nullable().optional(),
            employerName: z.string().optional(),
            employerCnpj: z.string().optional(),
            employerAddress: z.string().optional(),

            fullName: z.string().min(2),
            photoUrl: z.string().nullable().optional(),
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
            salaryRoleHistory: z.any().optional(),
            vacationsHistory: z.any().optional(),
            occupationalHealthHistory: z.any().optional(),
            unionContributions: z.any().optional(),
            generalObservations: z.string().nullable().optional(),

            unitId: z.string().uuid().nullable().optional(),
            sectorId: z.string().uuid().nullable().optional(),
            userId: z.string().uuid().nullable().optional(),

            createAccount: z
              .object({
                password: z.string().min(4),
                role: z
                  .enum([
                    'EMPLOYEE',
                    'FINANCIAL',
                    'SELLER',
                    'COLLECTOR',
                    'FISCAL',
                    'INVENTORY',
                    'ANALYST',
                    'HR',
                    'MANAGER',
                  ])
                  .default('EMPLOYEE'),
              })
              .optional(),
          }),
          response: {
            201: z.object({
              employeeId: z.string().uuid(),
              registrationNumber: z.string(),
            }),
          },
        },
      },
      async (request, reply) => {
        const currentUserId = await request.getCurrentUserId()
        const requestingUser = await prisma.user.findUnique({
          where: { id: currentUserId },
        })

        if (!requestingUser) {
          throw new UnauthorizedError()
        }

        const ability = defineAbilityFor({
          id: requestingUser.id,
          role: requestingUser.role,
          unitId: requestingUser.unitId,
        } as any)

        if (ability.cannot('create', 'Employee')) {
          throw new UnauthorizedError(
            'Você não tem permissão para cadastrar colaboradores.'
          )
        }

        const body = request.body
        const cleanCpf = body.cpf.replace(/\D/g, '')

        if (cleanCpf.length !== 11) {
          throw new BadRequestError('CPF inválido. Informe os 11 dígitos.')
        }

        const existingCpf = await prisma.employee.findUnique({
          where: { cpf: cleanCpf },
        })

        if (existingCpf) {
          throw new BadRequestError(
            'Já existe um colaborador cadastrado com este CPF.'
          )
        }

        // Generate or validate registrationNumber (MASTER-JSS0001)
        let registrationNumber = body.registrationNumber?.trim().toUpperCase()
        if (registrationNumber) {
          const existingReg = await prisma.employee.findUnique({
            where: { registrationNumber },
          })
          if (existingReg) {
            throw new BadRequestError(
              `A matrícula ${registrationNumber} já está em uso.`
            )
          }
        } else {
          const totalCount = await prisma.employee.count()
          let seq = totalCount + 1
          registrationNumber = formatRegistrationNumber(body.fullName, seq)

          // Ensure no collision on unique registrationNumber
          while (
            await prisma.employee.findUnique({
              where: { registrationNumber },
            })
          ) {
            seq += 1
            registrationNumber = formatRegistrationNumber(body.fullName, seq)
          }
        }

        let linkedUserId = body.userId || null

        if (linkedUserId) {
          const existingUserEmployee = await prisma.employee.findUnique({
            where: { userId: linkedUserId },
          })
          if (existingUserEmployee) {
            throw new BadRequestError(
              'Este usuário já está vinculado a outro colaborador.'
            )
          }
        } else if (body.createAccount) {
          const password_hash = await hash(body.createAccount.password, 6)
          const createdUser = await prisma.user.create({
            data: {
              name: body.fullName,
              username: registrationNumber,
              password_hash,
              role: body.createAccount.role,
              unitId: body.unitId || null,
            },
          })
          linkedUserId = createdUser.id
        }

        const employee = await prisma.employee.create({
          data: {
            registrationNumber,
            esocialCode: body.esocialCode || null,
            employerName: body.employerName || 'GERENCIACLIN LTDA',
            employerCnpj: body.employerCnpj || '59.162.564/0001-73',
            employerAddress:
              body.employerAddress ||
              'Rua IVONE PINHEIRO, 1590, SALA 08, TANCREDO NEVES, BOA VISTA, RR',
            fullName: body.fullName.trim(),
            photoUrl: body.photoUrl || null,
            birthDate: parseOptionalDate(body.birthDate),
            birthPlace: body.birthPlace || null,
            nationality: body.nationality || 'Brasileira',
            maritalStatus: body.maritalStatus || null,
            raceColor: body.raceColor || null,
            fatherName: body.fatherName || null,
            motherName: body.motherName || null,
            address: body.address || null,
            zipCode: body.zipCode || null,
            landlinePhone: body.landlinePhone || null,
            mobilePhone: body.mobilePhone || null,
            email: body.email || null,
            beneficiaries: body.beneficiaries ?? [],
            cpf: cleanCpf,
            rgNumber: body.rgNumber || null,
            rgIssueDate: parseOptionalDate(body.rgIssueDate),
            rgIssuer: body.rgIssuer || null,
            ctpsNumber: body.ctpsNumber || null,
            ctpsSeries: body.ctpsSeries || null,
            ctpsIssueDate: parseOptionalDate(body.ctpsIssueDate),
            ctpsState: body.ctpsState || 'RR',
            voterRegistration: body.voterRegistration || null,
            voterZone: body.voterZone || null,
            voterSection: body.voterSection || null,
            cnhNumber: body.cnhNumber || null,
            cnhCategory: body.cnhCategory || null,
            militaryDoc: body.militaryDoc || null,
            militaryCategory: body.militaryCategory || null,
            classCouncilNumber: body.classCouncilNumber || null,
            admissionDate: new Date(body.admissionDate),
            roleTitle: body.roleTitle.trim(),
            cboCode: body.cboCode || null,
            salary: body.salary,
            paymentType: body.paymentType || 'Mensal',
            workHoursSummary: body.workHoursSummary || null,
            breakHoursSummary: body.breakHoursSummary || null,
            fgtsOptionDate: parseOptionalDate(body.fgtsOptionDate),
            fgtsRectificationDate: parseOptionalDate(
              body.fgtsRectificationDate
            ),
            fgtsBankAccount: body.fgtsBankAccount || null,
            pisRegistrationDate: parseOptionalDate(body.pisRegistrationDate),
            pisNumber: body.pisNumber || null,
            pisBankName: body.pisBankName || null,
            pisBankNumber: body.pisBankNumber || null,
            pisBankBranch: body.pisBankBranch || null,
            pisBankAddress: body.pisBankAddress || null,
            workSchedule: body.workSchedule ?? null,
            salaryRoleHistory: body.salaryRoleHistory ?? [],
            vacationsHistory: body.vacationsHistory ?? [],
            occupationalHealthHistory: body.occupationalHealthHistory ?? [],
            unionContributions: body.unionContributions ?? [],
            generalObservations: body.generalObservations || null,
            unitId: body.unitId || null,
            sectorId: body.sectorId || null,
            userId: linkedUserId,
            createdById: currentUserId,
          },
        })

        await logAction({
          userId: currentUserId,
          action: 'CREATE',
          resource: 'EMPLOYEE',
          resourceId: employee.id,
          details: `Cadastrou o colaborador ${employee.fullName} (Matrícula: ${employee.registrationNumber}, Função: ${employee.roleTitle})`,
        })

        return reply.status(201).send({
          employeeId: employee.id,
          registrationNumber: employee.registrationNumber,
        })
      }
    )
}
