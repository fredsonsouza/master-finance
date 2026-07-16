import z from 'zod'
import { sectorSchema } from '../models/sector'

export const sectorSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal('Sector'), sectorSchema]),
])

export type SectorSubject = z.infer<typeof sectorSubject>
