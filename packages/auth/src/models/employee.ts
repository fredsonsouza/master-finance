import { z } from 'zod'

export const employeeSchema = z.object({
  __typename: z.literal('Employee').default('Employee'),
  id: z.string(),
  userId: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
})

export type Employee = z.infer<typeof employeeSchema>
