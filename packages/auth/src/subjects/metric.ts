import { z } from 'zod'

export const metricSubject = z.tuple([
  z.union([z.literal('get'), z.literal('manage')]),
  z.literal('Metric'),
])

export type MetricSubject = z.infer<typeof metricSubject>
