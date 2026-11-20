import z from 'zod'
import { permissionSchema } from '../permission-catalog'
import { roleSchema } from '../roles'

export const userSchema = z.object({
  id: z.string(),
  role: roleSchema,
  unitId: z.string().nullable().optional(),
  permissions: z.array(permissionSchema).optional().default([]),
})

export type User = z.input<typeof userSchema>
