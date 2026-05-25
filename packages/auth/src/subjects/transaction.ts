import z from 'zod'
import { transactionSchema } from '../models/transaction'

export const transactionSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal('Transaction'), transactionSchema]),
])

export type TransactionSubject = z.infer<typeof transactionSubject>
