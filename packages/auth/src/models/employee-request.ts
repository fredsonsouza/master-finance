import { z } from 'zod'

export const employeeRequestSchema = z.object({
  __typename: z.literal('EmployeeRequest').default('EmployeeRequest'),
  id: z.string(),
  employeeId: z.string(),
  requestedById: z.string(),
  unitId: z.string().nullable().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']).optional(),
})

export type EmployeeRequest = z.infer<typeof employeeRequestSchema>
