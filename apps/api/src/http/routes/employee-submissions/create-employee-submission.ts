import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { validateAndDecodeSubmissionPdf } from '@/utils/employee-submission-file'
import { type Permission, defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'
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

export async function createEmployeeSubmission(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/employee-submissions',
      {
        bodyLimit: 8_388_608, // 8 MB JSON limit to accommodate 5 MB PDF in Base64 + metadata
        schema: {
          tags: ['employee-submissions'],
          summary:
            'Submit a medical certificate or other PDF document by an employee (or HR on their behalf)',
          security: [{ bearerAuth: [] }],
          body: z.object({
            employeeId: z.string().uuid().optional(),
            category: z.enum([
              'MEDICAL_CERTIFICATE',
              'ATTENDANCE_DECLARATION',
              'PERSONAL_DOCUMENT',
              'OTHER',
            ]),
            title: z.string().min(2).max(160),
            description: z.string().max(2000).nullable().optional(),
            startDate: z.string().nullable().optional(),
            daysCount: z.coerce
              .number()
              .int()
              .min(1)
              .max(365)
              .nullable()
              .optional(),
            cid: z.string().max(20).nullable().optional(),
            fileName: z.string().min(1).max(200),
            mimeType: z.string().optional(),
            fileData: z.string().min(1),
            status: z
              .enum(['PENDING', 'APPROVED'])
              .optional()
              .default('PENDING'),
          }),
          response: {
            201: z.object({
              submission: z.any(),
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
          permissions: requestingUser.permissions as Permission[],
        })

        if (ability.cannot('create', 'EmployeeSubmission')) {
          throw new UnauthorizedError(
            'Você não tem permissão para enviar atestados ou documentos.'
          )
        }

        const canManageAll = ability.can('manage', 'EmployeeSubmission')
        const body = request.body

        let targetEmployeeId = body.employeeId

        if (!canManageAll) {
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
              'Informe o colaborador (employeeId) vinculado ao documento enviado.'
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

        const validatedPdf = validateAndDecodeSubmissionPdf({
          fileName: body.fileName,
          mimeType: body.mimeType,
          fileData: body.fileData,
        })

        const parsedStartDate = parseOptionalDate(body.startDate)
        if (body.startDate && !parsedStartDate) {
          throw new BadRequestError('Data de início inválida.')
        }

        const finalStatus =
          canManageAll && body.status === 'APPROVED' ? 'APPROVED' : 'PENDING'
        const reviewedAt = finalStatus === 'APPROVED' ? new Date() : null
        const reviewedById = finalStatus === 'APPROVED' ? currentUserId : null

        const submission = await prisma.employeeDocumentSubmission.create({
          data: {
            employeeId: employee.id,
            unitId: employee.unitId,
            submittedById: currentUserId,
            reviewedById,
            reviewedAt,
            category: body.category,
            title: body.title.trim(),
            description: body.description?.trim() || null,
            status: finalStatus,
            startDate: parsedStartDate,
            daysCount: body.daysCount ?? null,
            cid: body.cid?.trim().toUpperCase() || null,
            fileName: validatedPdf.fileName,
            mimeType: validatedPdf.mimeType,
            sizeBytes: validatedPdf.sizeBytes,
            sha256Hash: validatedPdf.sha256Hash,
            file: {
              create: {
                content: Uint8Array.from(validatedPdf.content),
              },
            },
          },
          include: {
            employee: {
              include: {
                unit: { select: { id: true, name: true } },
                sector: { select: { id: true, name: true } },
              },
            },
            submittedBy: {
              select: { id: true, name: true, role: true, permissions: true },
            },
            reviewedBy: {
              select: { id: true, name: true, role: true },
            },
          },
        })

        const sizeKb = Math.max(1, Math.round(validatedPdf.sizeBytes / 1024))
        await logAction({
          userId: currentUserId,
          action: 'CREATE',
          resource: 'EMPLOYEE_SUBMISSION',
          resourceId: submission.id,
          details: `Enviou documento PDF "${submission.title}" (${validatedPdf.fileName}, ${sizeKb} KB, categoria: ${submission.category}) para ${employee.fullName}`,
        })

        return reply.status(201).send({
          submission,
        })
      }
    )
}
