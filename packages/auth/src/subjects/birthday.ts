import { z } from 'zod'

export const birthdaySubject = z.tuple([
  z.union([z.literal('manage'), z.literal('get')]),
  z.literal('Birthday'),
])

export type BirthdaySubject = z.infer<typeof birthdaySubject>
