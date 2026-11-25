import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { type Permission, defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getEmployeeSubmissions(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/employee-submissions',
      {
        schema: {
          tags: ['employee-submissions'],
          summary:
            'List medical certificates and PDF documents submitted by employees (scoped for regular users, global for HR/Admin)',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            status: z
              .enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'])
              .optional(),
            category: z
              .enum([
                'MEDICAL_CERTIFICATE',
                'ATTENDANCE_DECLARATION',
                'PERSONAL_DOCUMENT',
                'OTHER',
              ])
              .optional(),
            employeeId: z.string().uuid().optional(),
            unitId: z.string().uuid().optional(),
            search: z.string().optional(),
            page: z.coerce.number().int().min(1).default(1),
            perPage: z.coerce.number().int().min(1).max(200).default(20),
          }),
          response: {
            200: z.object({
              submissions: z.any(),
              summary: z.object({
                totalCount: z.number(),
                pendingCount: z.number(),
                underReviewCount: z.number(),
                approvedCount: z.number(),
                rejectedCount: z.number(),
              }),
              pagination: z.object({
                page: z.number(),
                perPage: z.number(),
                totalCount: z.number(),
                totalPages: z.number(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const currentUserId = await request.getCurrentUserId()
        const requestingUser = await prisma.user.findUnique({
          where: { id: currentUserId },
          include: {
            employee: { select: { id: true } },
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

        const canManageAll = ability.can('manage', 'EmployeeSubmission')
        const { status, category, employeeId, unitId, search, page, perPage } =
          request.query

        const baseWhere: any = {}

        if (!canManageAll) {
          const ownConditions: any[] = [{ submittedById: currentUserId }]
          if (requestingUser.employee?.id) {
            ownConditions.push({ employeeId: requestingUser.employee.id })
          }
          baseWhere.OR = ownConditions
        } else {
          if (employeeId) {
            baseWhere.employeeId = employeeId
          }
          if (unitId) {
            baseWhere.unitId = unitId
          }
        }

        if (category) {
          baseWhere.category = category
        }

        if (search && search.trim().length > 0) {
          const term = search.trim()
          const searchOr = [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { fileName: { contains: term, mode: 'insensitive' } },
            { cid: { contains: term, mode: 'insensitive' } },
            {
              employee: {
                fullName: { contains: term, mode: 'insensitive' },
              },
            },
            {
              employee: {
                registrationNumber: { contains: term, mode: 'insensitive' },
              },
            },
          ]

          if (baseWhere.OR) {
            baseWhere.AND = [{ OR: baseWhere.OR }, { OR: searchOr }]
            baseWhere.OR = undefined
          } else {
            baseWhere.OR = searchOr
          }
        }

        const filteredWhere = status ? { ...baseWhere, status } : baseWhere
        const skip = (page - 1) * perPage

        const [
          totalCount,
          pendingCount,
          underReviewCount,
          approvedCount,
          rejectedCount,
          submissions,
        ] = await Promise.all([
          prisma.employeeDocumentSubmission.count({ where: baseWhere }),
          prisma.employeeDocumentSubmission.count({
            where: { ...baseWhere, status: 'PENDING' },
          }),
          prisma.employeeDocumentSubmission.count({
            where: { ...baseWhere, status: 'UNDER_REVIEW' },
          }),
          prisma.employeeDocumentSubmission.count({
            where: { ...baseWhere, status: 'APPROVED' },
          }),
          prisma.employeeDocumentSubmission.count({
            where: { ...baseWhere, status: 'REJECTED' },
          }),
          prisma.employeeDocumentSubmission.findMany({
            where: filteredWhere,
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
            orderBy: { createdAt: 'desc' },
            skip,
            take: perPage,
          }),
        ])

        const matchingTotal = status
          ? status === 'PENDING'
            ? pendingCount
            : status === 'UNDER_REVIEW'
              ? underReviewCount
              : status === 'APPROVED'
                ? approvedCount
                : rejectedCount
          : totalCount

        const totalPages = Math.ceil(matchingTotal / perPage) || 1

        return reply.status(200).send({
          submissions,
          summary: {
            totalCount,
            pendingCount,
            underReviewCount,
            approvedCount,
            rejectedCount,
          },
          pagination: {
            page,
            perPage,
            totalCount: matchingTotal,
            totalPages,
          },
        })
      }
    )
}
