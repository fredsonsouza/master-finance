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

test('[E2E] Create Sector', async () => {
  const user = await prisma.user.create({
    data: {
      name: 'Manager User',
      username: 'manager-create-sector',
      password_hash: await hash('123456', 1),
      role: 'MANAGER',
    },
  })

  const unit = await prisma.unit.create({
    data: {
      name: 'Unit For Sector',
    },
  })

  const token = app.jwt.sign({ sub: user.id })

  const response = await app.inject({
    method: 'POST',
    url: '/sectors',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    payload: {
      name: 'Pediatrics',
    },
  })

  expect(response.statusCode).toBe(201)
  expect(response.json()).toHaveProperty('sectorId')

  const sectorInDb = await prisma.sector.findUnique({
    where: { id: response.json().sectorId },
  })
  expect(sectorInDb?.name).toBe('Pediatrics')
})
