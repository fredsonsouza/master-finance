import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { generateElectronicSignature } from '@/utils/employee-registration'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createEmployeeRequest(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/employee-requests',
      {
        schema: {
          tags: ['employee-requests'],
          summary:
            'Create a document request (by employee) or issue a document directly (by HR/Manager/Admin)',
          security: [{ bearerAuth: [] }],
          body: z.object({
            employeeId: z.string().uuid().optional(),
            type: z.enum(['DECLARATION', 'WARNING', 'RECEIPT']),
            subtype: z.string().min(2),
            title: z.string().min(2),
            description: z.string().min(2),
            amount: z.number().nullable().optional(),
            referenceDate: z.string().optional(),
            templateData: z.any().optional(),
            status: z
              .enum(['OPEN', 'IN_PROGRESS', 'COMPLETED'])
              .optional()
              .default('OPEN'),
          }),
          response: {
            201: z.object({
              request: z.any(),
            }),
          },
        },
      },
      async (request, reply) => {
        const currentUserId = await request.getCurrentUserId()
        const requestingUser = await prisma.user.findUnique({
          where: { id: currentUserId },
          include: {
            employee: true,
          },
        })

        if (!requestingUser) {
          throw new UnauthorizedError()
        }

        const ability = defineAbilityFor({
          id: requestingUser.id,
          role: requestingUser.role,
          unitId: requestingUser.unitId,
        } as any)

        if (ability.cannot('create', 'EmployeeRequest')) {
          throw new UnauthorizedError(
            'Você não tem permissão para solicitar ou emitir documentos.'
          )
        }

        const canManageAll = ability.can('manage', 'EmployeeRequest')
        const body = request.body

        let targetEmployeeId = body.employeeId

        if (!canManageAll) {
          if (body.type === 'WARNING') {
            throw new UnauthorizedError(
              'Apenas o setor de RH ou Gerência pode emitir advertências.'
            )
          }

          if (!requestingUser.employee) {
            throw new BadRequestError(
              'Seu usuário ainda não possui uma ficha de colaborador vinculada no RH.'
            )
          }

          targetEmployeeId = requestingUser.employee.id
        } else if (!targetEmployeeId) {
          if (requestingUser.employee) {
            targetEmployeeId = requestingUser.employee.id
          } else {
            throw new BadRequestError(
              'Informe o colaborador (employeeId) para emitir ou registrar a solicitação.'
            )
          }
        }

        const employee = await prisma.employee.findUnique({
          where: { id: targetEmployeeId },
          include: {
            unit: { select: { id: true, name: true } },
            sector: { select: { id: true, name: true } },
          },
        })

        if (!employee) {
          throw new ResourceNotFoundError('Colaborador não encontrado.')
        }

        const finalStatus = canManageAll ? body.status || 'OPEN' : 'OPEN'

        let verificationCode: string | null = null
        let contentHash: string | null = null
        let signedAt: Date | null = null
        let issuedById: string | null = null

        if (finalStatus === 'COMPLETED') {
          signedAt = new Date()
          issuedById = currentUserId
          const sig = generateElectronicSignature({
            employeeId: employee.id,
            type: body.type,
            subtype: body.subtype,
            title: body.title,
            description: body.description,
            issuedById: currentUserId,
            signedAt,
          })
          verificationCode = sig.verificationCode
          contentHash = sig.contentHash
        }

        const createdRequest = await prisma.employeeRequest.create({
          data: {
            employeeId: employee.id,
            unitId: employee.unitId,
            requestedById: currentUserId,
            issuedById,
            type: body.type,
            subtype: body.subtype,
            title: body.title.trim(),
            description: body.description.trim(),
            status: finalStatus,
            amount: body.amount ?? null,
            referenceDate: body.referenceDate
              ? new Date(body.referenceDate)
              : new Date(),
            templateData: body.templateData ?? null,
            verificationCode,
            contentHash,
            signedAt,
          },
          include: {
            employee: {
              include: {
                unit: { select: { id: true, name: true } },
                sector: { select: { id: true, name: true } },
              },
            },
            requestedBy: { select: { id: true, name: true, role: true } },
            issuedBy: { select: { id: true, name: true, role: true } },
          },
        })

        await logAction({
          userId: currentUserId,
          action: 'CREATE',
          resource: 'EMPLOYEE_REQUEST',
          resourceId: createdRequest.id,
          details:
            finalStatus === 'COMPLETED'
              ? `Emitiu e assinou documento "${createdRequest.title}" (${createdRequest.verificationCode}) para ${employee.fullName}`
              : `Abriu solicitação de documento "${createdRequest.title}" para ${employee.fullName}`,
        })

        return reply.status(201).send({
          request: createdRequest,
        })
      }
    )
}
