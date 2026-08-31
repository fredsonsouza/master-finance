import { z } from 'zod'
import { hrReportSchema } from '../models/hr-report'

export const hrReportSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal('HrReport'), hrReportSchema]),
])

export type HrReportSubject = z.infer<typeof hrReportSubject>
