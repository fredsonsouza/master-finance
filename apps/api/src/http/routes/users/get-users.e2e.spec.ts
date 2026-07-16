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

test('[E2E] Get Users', async () => {
  const user = await prisma.user.create({
    data: {
      name: 'Admin User',
      username: 'admin-get-users',
      password_hash: await hash('123456', 1),
      role: 'ADMIN',
    },
  })

  const token = app.jwt.sign({ sub: user.id })

  const response = await app.inject({
    method: 'GET',
    url: '/users',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  expect(response.statusCode).toBe(200)
  expect(response.json().users).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ username: 'admin-get-users' }),
    ])
  )
})
