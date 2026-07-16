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

test('[E2E] Create Unit', async () => {
  const user = await prisma.user.create({
    data: {
      name: 'Admin User',
      username: 'admin-create-unit',
      password_hash: await hash('123456', 1),
      role: 'ADMIN',
    },
  })

  const token = app.jwt.sign({ sub: user.id })

  const response = await app.inject({
    method: 'POST',
    url: '/units',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    payload: {
      name: 'Central Clinic',
    },
  })

  expect(response.statusCode).toBe(201)
  expect(response.json()).toHaveProperty('unitId')

  const unit = await prisma.unit.findUnique({
    where: { id: response.json().unitId },
  })

  expect(unit).toBeTruthy()
  expect(unit?.name).toBe('Central Clinic')
})
