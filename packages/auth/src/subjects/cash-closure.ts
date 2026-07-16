import { z } from 'zod'

export const cashClosureSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([
    z.literal('CashClosure'),
    z.object({ __typename: z.literal('CashClosure') }).passthrough(),
  ]),
])

export type CashClosureSubject = z.infer<typeof cashClosureSubject>
