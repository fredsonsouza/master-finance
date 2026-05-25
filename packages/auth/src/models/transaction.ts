import { z } from 'zod'

export const transactionSchema = z.object({
  __typename: z.literal('Transaction').default('Transaction'),
  id: z.string(),
  unitId: z.string(),
})

export type Transaction = z.infer<typeof transactionSchema>
