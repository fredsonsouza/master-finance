import z from 'zod'

export const sectorSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.literal('Sector'),
])

export type SectorSubject = z.infer<typeof sectorSubject>
