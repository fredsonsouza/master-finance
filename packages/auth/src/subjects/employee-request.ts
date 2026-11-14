import { z } from 'zod'
import { employeeRequestSchema } from '../models/employee-request'

export const employeeRequestSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal('EmployeeRequest'), employeeRequestSchema]),
])

export type EmployeeRequestSubject = z.infer<typeof employeeRequestSubject>
