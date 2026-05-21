import z from 'zod'
import { itemSchema } from '../models/item'

export const itemSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('create'),
    z.literal('get'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal('Item'), itemSchema]),
])

export type ItemSubject = z.infer<typeof itemSubject>
