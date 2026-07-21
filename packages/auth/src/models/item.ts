import z from 'zod'

export const itemSchema = z.object({
  __typename: z.literal('Item').default('Item'),
  id: z.string(),
})

export type Item = z.infer<typeof itemSchema>
