import type { AbilityBuilder } from '@casl/ability'
import type { AppAbility } from '.'
import type { User } from './models/user'
import type { Role } from './roles'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>
) => void

export const permissions: Record<Role, PermissionsByRole> = {
  ADMIN(_, { can }) {
    can('manage', 'all')
  },

  MANAGER(_, { can }) {
    can('manage', ['Item', 'Sector', 'Unit', 'User', 'Transaction', 'Metric'])
  },

  EMPLOYEE(user, { can }) {
    can('get', 'Sector', { unitId: { $eq: user.unitId } })
    can('manage', 'Item', { unitId: { $eq: user.unitId } })
    can('manage', 'Transaction', { unitId: { $eq: user.unitId } })
  },
}
