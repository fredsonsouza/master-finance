import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { type Permission, defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'

const BOA_VISTA_TIMEZONE = 'America/Boa_Vista'
const MS_PER_DAY = 86_400_000

export interface LocalDateParts {
  year: number
  month: number
  day: number
}

export function getLocalDatePartsInBoaVista(
  now: Date = new Date()
): LocalDateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOA_VISTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  return { year, month, day }
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function getBirthdayTimestampUtc(
  year: number,
  birthMonth: number,
  birthDay: number
): number {
  const adjustedDay =
    birthMonth === 2 && birthDay === 29 && !isLeapYear(year) ? 28 : birthDay
  return Date.UTC(year, birthMonth - 1, adjustedDay)
}

export function computeDaysUntilBirthday(
  birthMonth: number,
  birthDay: number,
  today: LocalDateParts
): number {
  const todayUtc = Date.UTC(today.year, today.month - 1, today.day)
  let nextBirthdayUtc = getBirthdayTimestampUtc(
    today.year,
    birthMonth,
    birthDay
  )

  if (nextBirthdayUtc < todayUtc) {
    nextBirthdayUtc = getBirthdayTimestampUtc(
      today.year + 1,
      birthMonth,
      birthDay
    )
  }

  return Math.round((nextBirthdayUtc - todayUtc) / MS_PER_DAY)
}

const birthdayItemSchema = z.object({
  id: z.string(),
  registrationNumber: z.string(),
  fullName: z.string(),
  roleTitle: z.string(),
  photoUrl: z.string().nullable(),
  birthDay: z.number().int().min(1).max(31),
  birthMonth: z.number().int().min(1).max(12),
  daysUntilBirthday: z.number().int().min(0).max(366),
  isToday: z.boolean(),
  isTomorrow: z.boolean(),
  mobilePhone: z.string().nullable(),
  unit: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  department: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
})

export async function getEmployeeBirthdays(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/employees/birthdays',
      {
        schema: {
          tags: ['employees'],
          summary:
            'List active employee birthdays by month and upcoming birthday alerts',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            month: z.coerce.number().int().min(1).max(12).optional(),
            unitId: z.string().uuid().optional(),
            departmentId: z.string().uuid().optional(),
            upcomingDays: z.coerce.number().int().min(1).max(31).default(7),
            search: z.string().optional(),
            includePhotos: z.enum(['true', 'false']).default('true'),
          }),
          response: {
            200: z.object({
              referenceDate: z.string(),
              month: z.number().int().min(1).max(12),
              upcomingDays: z.number().int().min(1).max(31),
              monthBirthdays: z.array(birthdayItemSchema),
              upcomingAlerts: z.array(birthdayItemSchema),
              summary: z.object({
                monthTotal: z.number().int(),
                todayCount: z.number().int(),
                upcomingCount: z.number().int(),
                missingBirthDateCount: z.number().int(),
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
          permissions: requestingUser.permissions as Permission[],
        })

        if (ability.cannot('get', 'Birthday')) {
          throw new UnauthorizedError(
            'Você não tem permissão para visualizar aniversariantes.'
          )
        }

        const today = getLocalDatePartsInBoaVista()
        const {
          month = today.month,
          unitId,
          departmentId,
          upcomingDays,
          search,
          includePhotos,
        } = request.query

        const shouldIncludePhotos = includePhotos === 'true'
        const scopeWhere: {
          status: 'ACTIVE'
          unitId?: string
          departmentId?: string
        } = {
          status: 'ACTIVE',
          ...(unitId ? { unitId } : {}),
          ...(departmentId ? { departmentId } : {}),
        }

        const [missingBirthDateCount, employees] = await Promise.all([
          prisma.employee.count({
            where: {
              ...scopeWhere,
              birthDate: null,
            },
          }),
          prisma.employee.findMany({
            where: {
              ...scopeWhere,
              birthDate: { not: null },
            },
            select: {
              id: true,
              registrationNumber: true,
              fullName: true,
              roleTitle: true,
              photoUrl: shouldIncludePhotos,
              birthDate: true,
              mobilePhone: true,
              unit: { select: { id: true, name: true } },
              department: { select: { id: true, name: true } },
            },
            orderBy: { fullName: 'asc' },
          }),
        ])

        const normalizedSearch = search?.trim().toLowerCase() ?? ''

        const mapped = employees
          .filter((emp) => emp.birthDate instanceof Date)
          .map((emp) => {
            const birthDate = emp.birthDate as Date
            const birthMonth = birthDate.getUTCMonth() + 1
            const birthDay = birthDate.getUTCDate()
            const daysUntilBirthday = computeDaysUntilBirthday(
              birthMonth,
              birthDay,
              today
            )

            return {
              id: emp.id,
              registrationNumber: emp.registrationNumber,
              fullName: emp.fullName,
              roleTitle: emp.roleTitle,
              photoUrl: shouldIncludePhotos
                ? ((emp as { photoUrl?: string | null }).photoUrl ?? null)
                : null,
              birthDay,
              birthMonth,
              daysUntilBirthday,
              isToday: daysUntilBirthday === 0,
              isTomorrow: daysUntilBirthday === 1,
              mobilePhone: emp.mobilePhone,
              unit: emp.unit,
              department: emp.department,
            }
          })

        const monthBirthdays = mapped
          .filter((item) => {
            if (item.birthMonth !== month) return false
            if (!normalizedSearch) return true
            return (
              item.fullName.toLowerCase().includes(normalizedSearch) ||
              item.roleTitle.toLowerCase().includes(normalizedSearch) ||
              item.registrationNumber.toLowerCase().includes(normalizedSearch)
            )
          })
          .sort(
            (a, b) =>
              a.birthDay - b.birthDay ||
              a.fullName.localeCompare(b.fullName, 'pt-BR')
          )

        const upcomingAlerts = mapped
          .filter((item) => item.daysUntilBirthday <= upcomingDays)
          .sort(
            (a, b) =>
              a.daysUntilBirthday - b.daysUntilBirthday ||
              a.fullName.localeCompare(b.fullName, 'pt-BR')
          )

        const todayCount = upcomingAlerts.filter((item) => item.isToday).length
        const referenceDate = `${today.year}-${String(today.month).padStart(2, '0')}-${String(today.day).padStart(2, '0')}`

        return reply.status(200).send({
          referenceDate,
          month,
          upcomingDays,
          monthBirthdays,
          upcomingAlerts,
          summary: {
            monthTotal: monthBirthdays.length,
            todayCount,
            upcomingCount: upcomingAlerts.length,
            missingBirthDateCount,
          },
        })
      }
    )
}
