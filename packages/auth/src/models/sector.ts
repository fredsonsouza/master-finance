import { z } from 'zod'

export const sectorSchema = z.object({
  __typename: z.literal('Sector').default('Sector'),
  id: z.string(),
  unitId: z.string(),
})

export type Sector = z.infer<typeof sectorSchema>
