import z from 'zod'

export const roleSchema = z.union([
  z.literal('ADMIN'),
  z.literal('MANAGER'),
  z.literal('EMPLOYEE'),
  z.literal('FINANCIAL'),
  z.literal('SELLER'),
  z.literal('COLLECTOR'),
  z.literal('FISCAL'),
])

export type Role = z.infer<typeof roleSchema>
