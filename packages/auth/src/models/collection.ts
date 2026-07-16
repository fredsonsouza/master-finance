import { z } from 'zod'

export const collectionSchema = z.object({
  __typename: z.literal('Collection').default('Collection'),
  id: z.string(),
  unitId: z.string(),
  userId: z.string(),
})

export type Collection = z.infer<typeof collectionSchema>
