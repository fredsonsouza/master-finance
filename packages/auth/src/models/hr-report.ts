import { z } from 'zod'

export const hrReportSchema = z.object({
  __typename: z.literal('HrReport').default('HrReport'),
  id: z.string(),
  userId: z.string(),
  unitId: z.string().nullable().optional(),
  status: z.union([z.literal('DRAFT'), z.literal('SENT')]),
})

export type HrReport = z.infer<typeof hrReportSchema>
