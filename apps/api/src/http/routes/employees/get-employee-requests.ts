import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getEmployeeRequests(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/employee-requests',
      {
        schema: {
          tags: ['employee-requests'],
          summary:
            'List employee document requests and issued documents (scoped for regular users, global for HR/Admin/Manager)',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            status: z
              .enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'])
              .optional(),
            type: z.enum(['DECLARATION', 'WARNING', 'RECEIPT']).optional(),
            employeeId: z.string().uuid().optional(),
            unitId: z.string().uuid().optional(),
            search: z.string().optional(),
            page: z.coerce.number().int().min(1).default(1),
            perPage: z.coerce.number().int().min(1).max(200).default(20),
          }),
          response: {
            200: z.object({
              requests: z.any(),
              summary: z.object({
                totalCount: z.number(),
                openCount: z.number(),
                inProgressCount: z.number(),
                completedCount: z.number(),
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
        } as any)

        const canManageAll = ability.can('manage', 'EmployeeRequest')
        const { status, type, employeeId, unitId, search, page, perPage } =
          request.query

        const baseWhere: any = {}

        if (!canManageAll) {
          const ownConditions: any[] = [{ requestedById: currentUserId }]
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

        if (type) {
          baseWhere.type = type
        }

        if (search && search.trim().length > 0) {
          const term = search.trim()
          const searchOr = [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { verificationCode: { contains: term, mode: 'insensitive' } },
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
          openCount,
          inProgressCount,
          completedCount,
          rejectedCount,
          requests,
        ] = await Promise.all([
          prisma.employeeRequest.count({ where: baseWhere }),
          prisma.employeeRequest.count({
            where: { ...baseWhere, status: 'OPEN' },
          }),
          prisma.employeeRequest.count({
            where: { ...baseWhere, status: 'IN_PROGRESS' },
          }),
          prisma.employeeRequest.count({
            where: { ...baseWhere, status: 'COMPLETED' },
          }),
          prisma.employeeRequest.count({
            where: { ...baseWhere, status: 'REJECTED' },
          }),
          prisma.employeeRequest.findMany({
            where: filteredWhere,
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
            orderBy: { createdAt: 'desc' },
            skip,
            take: perPage,
          }),
        ])

        const matchingTotal = status
          ? status === 'OPEN'
            ? openCount
            : status === 'IN_PROGRESS'
              ? inProgressCount
              : status === 'COMPLETED'
                ? completedCount
                : rejectedCount
          : totalCount

        const totalPages = Math.ceil(matchingTotal / perPage) || 1

        return reply.status(200).send({
          requests,
          summary: {
            totalCount,
            openCount,
            inProgressCount,
            completedCount,
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
