import {
  AbilityBuilder,
  type CreateAbility,
  type MongoAbility,
  createMongoAbility,
} from '@casl/ability'
import z from 'zod'
import type { User } from './models/user'
import { permissions } from './permissions'
import { cashClosureSubject } from './subjects/cash-closure'
import { categorySubject } from './subjects/category'
import { collectionSubject } from './subjects/collection'
import { departmentSubject } from './subjects/department'
import { employeeSubject } from './subjects/employee'
import { employeeRequestSubject } from './subjects/employee-request'
import { evaluationSubject } from './subjects/evaluation'
import { hrReportSubject } from './subjects/hr-report'
import { itemSubject } from './subjects/item'
import { metricSubject } from './subjects/metric'
import { sectorSubject } from './subjects/sector'
import { transactionSubject } from './subjects/transaction'
import { unitSubject } from './subjects/unit'
import { userSubject } from './subjects/user'

export {
  PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_PRESETS,
  PRIVILEGED_PERMISSIONS,
  canGrantAccess,
  getDefaultHomeRoute,
  hasAnyPermission,
  hasPermission,
  permissionSchema,
  type Permission,
  type PermissionDefinition,
  type PermissionGroup,
  type PermissionPreset,
  type PermissionSubjectUser,
} from './permission-catalog'
export { roleSchema, type Role } from './roles'
export { userSchema, type User } from './models/user'

const appAbilitiesSchema = z.union([
  categorySubject,
  sectorSubject,
  departmentSubject,
  userSubject,
  itemSubject,
  unitSubject,
  transactionSubject,
  metricSubject,
  cashClosureSubject,
  collectionSubject,
  evaluationSubject,
  hrReportSubject,
  employeeSubject,
  employeeRequestSubject,

  z.tuple([z.literal('manage'), z.literal('all')]),
])

type AppAbilities = z.infer<typeof appAbilitiesSchema>

export type AppAbility = MongoAbility<AppAbilities>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility)

  if (typeof permissions[user.role] !== 'function') {
    throw new Error(`Permissions for role ${user.role} not found`)
  }

  permissions[user.role](user, builder)

  const ability = builder.build({
    detectSubjectType(subject) {
      if (typeof subject === 'string') {
        return subject
      }
      if (subject && typeof subject === 'object' && '__typename' in subject) {
        return (subject as any).__typename
      }
      return (subject as any).constructor?.name ?? subject
    },
  })

  return ability
}
