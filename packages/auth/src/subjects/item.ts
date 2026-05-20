import z from 'zod'

export const itemSubject = z.tuple([
  z.union([
    z.literal('create'),
    z.literal('get'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.literal('Item'),
])

export type ItemSubject = z.infer<typeof itemSubject>
