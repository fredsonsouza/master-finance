import { prisma } from '@/lib/prisma'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import {
  computeDaysUntilBirthday,
  getEmployeeBirthdays,
  getLocalDatePartsInBoaVista,
} from './get-employee-birthdays'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    employee: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('Employee Birthdays Unit Tests', () => {
  let app: ReturnType<typeof fastify>
  const adminId = '123e4567-e89b-12d3-a456-426614174000'
  const userId = '223e4567-e89b-12d3-a456-426614174001'

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // 2026-11-27 22:30 Boa Vista (UTC-4) => 2026-11-28 02:30 UTC
    // Ensures Boa Vista timezone is honored even after 20:00 local time
    vi.setSystemTime(new Date('2026-11-28T02:30:00.000Z'))

    app = fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    app.decorateRequest('jwtVerify', vi.fn().mockResolvedValue({ sub: userId }))

    app.setErrorHandler((error: any, _request: any, reply: any) => {
      if (error instanceof UnauthorizedError) {
        return reply.status(401).send({ message: error.message })
      }
      return reply.status(500).send({ message: error.message })
    })

    await app.register(getEmployeeBirthdays)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('computes local date in America/Boa_Vista correctly after 20:00 local time', () => {
    const parts = getLocalDatePartsInBoaVista(
      new Date('2026-11-28T02:30:00.000Z')
    )
    expect(parts).toEqual({ year: 2026, month: 11, day: 27 })
  })

  test('computes daysUntilBirthday across year rollover and leap day', () => {
    // Dec 29 -> Jan 2 should be 4 days
    expect(
      computeDaysUntilBirthday(1, 2, { year: 2026, month: 12, day: 29 })
    ).toBe(4)

    // Feb 29 in non-leap year 2026 celebrates on Feb 28 (0 days on Feb 28)
    expect(
      computeDaysUntilBirthday(2, 29, { year: 2026, month: 2, day: 28 })
    ).toBe(0)

    // Feb 29 in leap year 2028 celebrates on Feb 29 (1 day on Feb 28)
    expect(
      computeDaysUntilBirthday(2, 29, { year: 2028, month: 2, day: 28 })
    ).toBe(1)
  })

  test('blocks users without birthdays:manage permission', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: userId,
      role: 'EMPLOYEE',
      unitId: null,
      permissions: ['employees:manage'],
    })

    const res = await app.inject({
      method: 'GET',
      url: '/employees/birthdays',
    })

    expect(res.statusCode).toBe(401)
  })

  test('allows user with birthdays:manage permission and orders month + upcoming alerts properly', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: userId,
      role: 'EMPLOYEE',
      unitId: null,
      permissions: ['birthdays:manage'],
    })
    ;(prisma.employee.count as any).mockResolvedValue(2)
    ;(prisma.employee.findMany as any).mockResolvedValue([
      {
        id: 'emp-1',
        registrationNumber: 'MASTER-0001',
        fullName: 'Carlos Souza',
        roleTitle: 'Coletador',
        photoUrl: 'data:image/jpeg;base64,abc',
        birthDate: new Date('1990-11-28T00:00:00.000Z'),
        mobilePhone: '(95) 99999-1111',
        unit: { id: 'u1', name: 'Matriz' },
        department: { id: 'd1', name: 'Coleta' },
      },
      {
        id: 'emp-2',
        registrationNumber: 'MASTER-0002',
        fullName: 'Ana Paula',
        roleTitle: 'Recepcionista',
        photoUrl: null,
        birthDate: new Date('1995-11-27T00:00:00.000Z'),
        mobilePhone: '(95) 99999-2222',
        unit: { id: 'u1', name: 'Matriz' },
        department: { id: 'd2', name: 'Recepção' },
      },
      {
        id: 'emp-3',
        registrationNumber: 'MASTER-0003',
        fullName: 'Bruno Lima',
        roleTitle: 'Biomédico',
        photoUrl: null,
        birthDate: new Date('1988-12-02T00:00:00.000Z'),
        mobilePhone: null,
        unit: { id: 'u2', name: 'MHM' },
        department: null,
      },
      {
        id: 'emp-4',
        registrationNumber: 'MASTER-0004',
        fullName: 'Daniela Reis',
        roleTitle: 'Auxiliar',
        photoUrl: null,
        birthDate: new Date('1992-11-05T00:00:00.000Z'),
        mobilePhone: null,
        unit: null,
        department: null,
      },
    ])

    const res = await app.inject({
      method: 'GET',
      url: '/employees/birthdays?upcomingDays=7',
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()

    expect(body.referenceDate).toBe('2026-11-27')
    expect(body.month).toBe(11)
    expect(body.summary).toEqual({
      monthTotal: 3,
      todayCount: 1,
      upcomingCount: 3,
      missingBirthDateCount: 2,
    })

    // Month birthdays ordered by day: 5, 27, 28
    expect(body.monthBirthdays.map((b: any) => b.fullName)).toEqual([
      'Daniela Reis',
      'Ana Paula',
      'Carlos Souza',
    ])

    // Upcoming alerts ordered by proximity: Ana (0d), Carlos (1d), Bruno (5d in Dec!)
    expect(
      body.upcomingAlerts.map((b: any) => ({
        name: b.fullName,
        days: b.daysUntilBirthday,
        isToday: b.isToday,
        isTomorrow: b.isTomorrow,
      }))
    ).toEqual([
      { name: 'Ana Paula', days: 0, isToday: true, isTomorrow: false },
      { name: 'Carlos Souza', days: 1, isToday: false, isTomorrow: true },
      { name: 'Bruno Lima', days: 5, isToday: false, isTomorrow: false },
    ])

    // Verify Prisma strictly filtered ACTIVE employees with non-null birthDate
    expect(prisma.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'ACTIVE',
          birthDate: { not: null },
        },
      })
    )
  })

  test('allows ADMIN and omits photos when includePhotos=false', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: adminId,
      role: 'ADMIN',
      unitId: null,
      permissions: [],
    })
    ;(prisma.employee.count as any).mockResolvedValue(0)
    ;(prisma.employee.findMany as any).mockResolvedValue([
      {
        id: 'emp-1',
        registrationNumber: 'MASTER-0001',
        fullName: 'Ana Paula',
        roleTitle: 'Recepcionista',
        birthDate: new Date('1995-11-27T00:00:00.000Z'),
        mobilePhone: null,
        unit: null,
        department: null,
      },
    ])

    const res = await app.inject({
      method: 'GET',
      url: '/employees/birthdays?includePhotos=false',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().monthBirthdays[0].photoUrl).toBeNull()
    expect(prisma.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          photoUrl: false,
        }),
      })
    )
  })
})
