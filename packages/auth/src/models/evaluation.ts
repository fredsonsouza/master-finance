import z from 'zod'

export const evaluationSchema = z.object({
  __typename: z.literal('Evaluation').default('Evaluation'),
  id: z.string(),
  sellerId: z.string(),
  unitId: z.string().nullable().optional(),
})

export type Evaluation = z.infer<typeof evaluationSchema>
