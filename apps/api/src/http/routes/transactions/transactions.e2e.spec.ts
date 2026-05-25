import { test, expect, beforeAll, afterAll } from 'vitest'
import { app } from '@/http/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

beforeAll(async () => {
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

test('[E2E] Transactions Flow', async () => {
  const unit = await prisma.unit.create({
    data: {
      name: 'Finance Unit',
    },
  })

  const item = await prisma.item.create({
    data: {
      name: 'Office Desk',
      unitId: unit.id,
    },
  })

  const user = await prisma.user.create({
    data: {
      name: 'Finance Manager',
      username: 'finance-manager',
      password_hash: await hash('123456', 1),
      role: 'MANAGER',
    },
  })

  const token = app.jwt.sign({ sub: user.id })

  // 1. Create Transaction
  const createResponse = await app.inject({
    method: 'POST',
    url: '/transactions',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    payload: {
      type: 'EXIT',
      date: new Date('2026-05-25T14:00:00Z').toISOString(),
      value: 1200.5,
      quantity: 1,
      itemId: item.id,
      unitId: unit.id,
    },
  })

  expect(createResponse.statusCode).toBe(201)
  const { transactionId } = createResponse.json()
  expect(transactionId).toBeTruthy()

  // 2. Check Database Record
  const transactionInDb = await prisma.transaction.findUnique({
    where: { id: transactionId },
  })
  expect(transactionInDb?.month).toBe('2026-05') // Validates auto-computation

  // 3. Get Transactions List
  const getResponse = await app.inject({
    method: 'GET',
    url: '/transactions?month=2026-05',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  expect(getResponse.statusCode).toBe(200)
  expect(getResponse.json().transactions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: transactionId, value: 1200.5, type: 'EXIT' }),
    ])
  )
})
