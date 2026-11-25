import { z } from 'zod'

export const employeeSubmissionSchema = z.object({
  __typename: z.literal('EmployeeSubmission').default('EmployeeSubmission'),
  id: z.string(),
  employeeId: z.string(),
  submittedById: z.string(),
  unitId: z.string().nullable().optional(),
  status: z
    .enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'])
    .optional(),
})

export type EmployeeSubmission = z.infer<typeof employeeSubmissionSchema>
