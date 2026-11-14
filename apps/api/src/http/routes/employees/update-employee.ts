import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

const parseOptionalDate = (val?: string | null) => {
  if (val === undefined) return undefined
  if (val === null || val === '') return null
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function updateEmployee(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/employees/:id',
      {
        schema: {
          tags: ['employees'],
          summary: 'Update an employee record (Ficha de Registro)',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            registrationNumber: z.string().optional(),
            esocialCode: z.string().nullable().optional(),
            employerName: z.string().optional(),
            employerCnpj: z.string().optional(),
            employerAddress: z.string().optional(),

            fullName: z.string().min(2).optional(),
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

            cpf: z.string().min(11).optional(),
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

            admissionDate: z.string().optional(),
            roleTitle: z.string().min(2).optional(),
            cboCode: z.string().nullable().optional(),
            salary: z.number().min(0).optional(),
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

            terminationDate: z.string().nullable().optional(),
            terminationType: z.string().nullable().optional(),
            terminationNotes: z.string().nullable().optional(),

            unitId: z.string().uuid().nullable().optional(),
            sectorId: z.string().uuid().nullable().optional(),
            userId: z.string().uuid().nullable().optional(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const currentUserId = await request.getCurrentUserId()
        const { id } = request.params

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

        if (ability.cannot('update', 'Employee')) {
          throw new UnauthorizedError(
            'Você não tem permissão para editar colaboradores.'
          )
        }

        const existingEmployee = await prisma.employee.findUnique({
          where: { id },
        })

        if (!existingEmployee) {
          throw new ResourceNotFoundError('Colaborador não encontrado.')
        }

        const body = request.body
        const dataToUpdate: any = {}

        if (body.cpf !== undefined) {
          const cleanCpf = body.cpf.replace(/\D/g, '')
          if (cleanCpf.length !== 11) {
            throw new BadRequestError('CPF inválido. Informe os 11 dígitos.')
          }
          if (cleanCpf !== existingEmployee.cpf) {
            const cpfTaken = await prisma.employee.findUnique({
              where: { cpf: cleanCpf },
            })
            if (cpfTaken) {
              throw new BadRequestError(
                'Já existe outro colaborador com este CPF.'
              )
            }
          }
          dataToUpdate.cpf = cleanCpf
        }

        if (body.registrationNumber !== undefined) {
          const reg = body.registrationNumber.trim().toUpperCase()
          if (reg !== existingEmployee.registrationNumber) {
            const regTaken = await prisma.employee.findUnique({
              where: { registrationNumber: reg },
            })
            if (regTaken) {
              throw new BadRequestError(
                `A matrícula ${reg} já pertence a outro colaborador.`
              )
            }
          }
          dataToUpdate.registrationNumber = reg
        }

        if (
          body.userId !== undefined &&
          body.userId !== existingEmployee.userId
        ) {
          if (body.userId) {
            const userTaken = await prisma.employee.findUnique({
              where: { userId: body.userId },
            })
            if (userTaken) {
              throw new BadRequestError(
                'Este usuário já está vinculado a outro colaborador.'
              )
            }
          }
          dataToUpdate.userId = body.userId
        }

        const directFields = [
          'esocialCode',
          'employerName',
          'employerCnpj',
          'employerAddress',
          'fullName',
          'photoUrl',
          'birthPlace',
          'nationality',
          'maritalStatus',
          'raceColor',
          'fatherName',
          'motherName',
          'address',
          'zipCode',
          'landlinePhone',
          'mobilePhone',
          'email',
          'beneficiaries',
          'rgNumber',
          'rgIssuer',
          'ctpsNumber',
          'ctpsSeries',
          'ctpsState',
          'voterRegistration',
          'voterZone',
          'voterSection',
          'cnhNumber',
          'cnhCategory',
          'militaryDoc',
          'militaryCategory',
          'classCouncilNumber',
          'roleTitle',
          'cboCode',
          'salary',
          'paymentType',
          'workHoursSummary',
          'breakHoursSummary',
          'fgtsBankAccount',
          'pisNumber',
          'pisBankName',
          'pisBankNumber',
          'pisBankBranch',
          'pisBankAddress',
          'workSchedule',
          'salaryRoleHistory',
          'vacationsHistory',
          'occupationalHealthHistory',
          'unionContributions',
          'generalObservations',
          'terminationType',
          'terminationNotes',
          'unitId',
          'sectorId',
        ] as const

        for (const field of directFields) {
          if (body[field] !== undefined) {
            dataToUpdate[field] = body[field]
          }
        }

        const dateFields = [
          'birthDate',
          'rgIssueDate',
          'ctpsIssueDate',
          'admissionDate',
          'fgtsOptionDate',
          'fgtsRectificationDate',
          'pisRegistrationDate',
          'terminationDate',
        ] as const

        for (const dField of dateFields) {
          if (body[dField] !== undefined) {
            dataToUpdate[dField] = parseOptionalDate(body[dField])
          }
        }

        const updated = await prisma.employee.update({
          where: { id },
          data: dataToUpdate,
        })

        await logAction({
          userId: currentUserId,
          action: 'UPDATE',
          resource: 'EMPLOYEE',
          resourceId: id,
          details: `Atualizou a ficha do colaborador ${updated.fullName} (Matrícula: ${updated.registrationNumber})`,
        })

        return reply.status(204).send(null)
      }
    )
}
