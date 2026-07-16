import { z } from 'zod'
import { collectionSchema } from '../models/collection'

export const collectionSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal('Collection'), collectionSchema]),
])

export type CollectionSubject = z.infer<typeof collectionSubject>
