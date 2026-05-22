import { test, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../../server'
import { prisma } from '@/lib/prisma'

beforeAll(async () => {
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

test('should be able to create a new account', async () => {
  const response = await request(app.server).post('/users').send({
    name: 'John Doe',
    username: 'jhon',
    password: 'password123',
  })

  expect(response.statusCode).toEqual(201)

  const userOnDb = await prisma.user.findUnique({
    where: {
      username: 'jhon',
    },
  })

  expect(userOnDb).toBeTruthy()
})
