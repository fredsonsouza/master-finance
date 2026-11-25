import { z } from 'zod'
import { employeeSubmissionSchema } from '../models/employee-submission'

export const employeeSubmissionSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal('EmployeeSubmission'), employeeSubmissionSchema]),
])

export type EmployeeSubmissionSubject = z.infer<
  typeof employeeSubmissionSubject
>
