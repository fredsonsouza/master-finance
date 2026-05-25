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

test('[E2E] Authenticate User', async () => {
  await prisma.user.create({
    data: {
      name: 'John E2E',
      username: 'auth-e2e',
      password_hash: await hash('123456', 1),
      role: 'ADMIN',
    },
  })

  const response = await app.inject({
    method: 'POST',
    url: '/sessions/password',
    payload: {
      username: 'auth-e2e',
      password: '123456',
    },
  })

  expect(response.statusCode).toBe(201)
  expect(response.json()).toHaveProperty('token')
})
