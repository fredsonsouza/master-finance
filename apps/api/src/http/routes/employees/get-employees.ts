import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getEmployees(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/employees',
      {
        schema: {
          tags: ['employees'],
          summary: 'List employees with search, filters, and summary counters',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            search: z.string().optional(),
            status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
            unitId: z.string().uuid().optional(),
            sectorId: z.string().uuid().optional(),
            page: z.coerce.number().int().min(1).default(1),
            perPage: z.coerce.number().int().min(1).max(200).default(20),
          }),
          response: {
            200: z.object({
              employees: z.any(),
              summary: z.object({
                totalCount: z.number(),
                activeCount: z.number(),
                inactiveCount: z.number(),
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
        })

        if (!requestingUser) {
          throw new UnauthorizedError()
        }

        const ability = defineAbilityFor({
          id: requestingUser.id,
          role: requestingUser.role,
          unitId: requestingUser.unitId,
        } as any)

        if (ability.cannot('get', 'Employee')) {
          throw new UnauthorizedError(
            'Você não tem permissão para listar colaboradores.'
          )
        }

        const { search, status, unitId, sectorId, page, perPage } =
          request.query

        const baseWhere: any = {}

        if (unitId) {
          baseWhere.unitId = unitId
        }

        if (sectorId) {
          baseWhere.sectorId = sectorId
        }

        if (search && search.trim().length > 0) {
          const term = search.trim()
          const digitsOnly = term.replace(/\D/g, '')
          baseWhere.OR = [
            { fullName: { contains: term, mode: 'insensitive' } },
            { registrationNumber: { contains: term, mode: 'insensitive' } },
            { roleTitle: { contains: term, mode: 'insensitive' } },
            ...(digitsOnly.length > 0
              ? [{ cpf: { contains: digitsOnly } }]
              : []),
          ]
        }

        const filteredWhere = status ? { ...baseWhere, status } : baseWhere
        const skip = (page - 1) * perPage

        const [totalCount, activeCount, inactiveCount, employees] =
          await Promise.all([
            prisma.employee.count({ where: baseWhere }),
            prisma.employee.count({
              where: { ...baseWhere, status: 'ACTIVE' },
            }),
            prisma.employee.count({
              where: { ...baseWhere, status: 'INACTIVE' },
            }),
            prisma.employee.findMany({
              where: filteredWhere,
              include: {
                unit: { select: { id: true, name: true } },
                sector: { select: { id: true, name: true } },
                user: {
                  select: { id: true, name: true, username: true, role: true },
                },
              },
              orderBy: [{ status: 'asc' }, { fullName: 'asc' }],
              skip,
              take: perPage,
            }),
          ])

        const matchingTotal = status
          ? status === 'ACTIVE'
            ? activeCount
            : inactiveCount
          : totalCount
        const totalPages = Math.ceil(matchingTotal / perPage) || 1

        return reply.status(200).send({
          employees,
          summary: {
            totalCount,
            activeCount,
            inactiveCount,
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
