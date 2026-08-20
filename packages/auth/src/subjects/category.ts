import { z } from 'zod'
import { categorySchema } from '../models/category'

export const categorySubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal('Category'), categorySchema]),
])

export type CategorySubject = z.infer<typeof categorySubject>
