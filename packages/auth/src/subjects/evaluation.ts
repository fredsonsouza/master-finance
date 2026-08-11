import z from 'zod'
import { evaluationSchema } from '../models/evaluation'

export const evaluationSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('create'),
    z.literal('get'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal('Evaluation'), evaluationSchema]),
])

export type EvaluationSubject = z.infer<typeof evaluationSubject>
