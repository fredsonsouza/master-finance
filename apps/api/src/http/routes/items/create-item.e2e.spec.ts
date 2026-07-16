import { app } from '@/http/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { afterAll, beforeAll, expect, test } from 'vitest'

beforeAll(async () => {
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

test('[E2E] Create Item', async () => {
  const unit = await prisma.unit.create({
    data: {
      name: 'Item Unit',
    },
  })

  const user = await prisma.user.create({
    data: {
      name: 'Employee User',
      username: 'employee-create-item',
      password_hash: await hash('123456', 1),
      role: 'EMPLOYEE',
      unitId: unit.id,
    },
  })

  const sector = await prisma.sector.create({
    data: {
      name: 'General',
    },
  })

  const token = app.jwt.sign({ sub: user.id })

  const response = await app.inject({
    method: 'POST',
    url: '/items',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    payload: {
      name: 'Syringe',
      description: 'Standard 10ml',
      unitId: unit.id,
      sectorId: sector.id,
    },
  })

  expect(response.statusCode).toBe(201)
  expect(response.json()).toHaveProperty('itemId')
})
