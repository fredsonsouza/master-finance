import { test, expect, describe, vi, beforeEach } from 'vitest'
import fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { updatePassword } from './update-password'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('new_mocked_hash'),
}))

describe('Update Password Unit Test', () => {
  let app: ReturnType<typeof fastify>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)
    
    app.decorateRequest('jwtVerify', vi.fn().mockResolvedValue({ sub: 'user-id-123' }))
    
    
    await app.register(updatePassword)
  })

  test('should update password and reset forcePasswordChange flag', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/update-password',
      payload: {
        password: 'new-secure-password',
      },
    })

    expect(response.statusCode).toBe(204)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id-123' },
      data: {
        password_hash: 'new_mocked_hash',
        forcePasswordChange: false,
      },
    })
  })

  test('should fail validation if password is too short', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/users/update-password',
      payload: {
        password: '123', // z.string().min(4) requires at least 4 characters
      },
    })

    expect(response.statusCode).toBe(400)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})
