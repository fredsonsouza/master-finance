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
    can('get', 'Item')
    can('manage', [
      'Sector',
      'Unit',
      'User',
      'Transaction',
      'Metric',
      'CashClosure',
      'Collection',
    ])
  },

  FINANCIAL(_, { can }) {
    can('manage', ['Transaction', 'Metric', 'CashClosure'])
    can('get', ['Item', 'Sector', 'Unit', 'User'])
  },

  EMPLOYEE(user, { can }) {
    can('get', 'Sector')
    can('get', 'Item')
    can('manage', 'Transaction', { unitId: { $eq: user.unitId } })
  },

  SELLER(user, { can }) {
    can('get', 'Sector')
    can('get', 'Item')
    can('manage', 'Transaction', { unitId: { $eq: user.unitId } })

    can('create', 'CashClosure')
    can('get', 'CashClosure', { unitId: { $eq: user.unitId } })
    can('update', 'CashClosure', ['cashDate', 'value', 'observation'], {
      userId: { $eq: user.id },
      status: { $eq: 'OPEN' },
    })
  },

  COLLECTOR(user, { can }) {
    can('get', 'Collection', { unitId: { $eq: user.unitId } })
  },

  FISCAL(user, { can }) {
    can('manage', 'Collection')
    can('get', 'User', { unitId: { $eq: user.unitId } })
    can('get', 'Unit')
  },

  INVENTORY(_, { can }) {
    can('manage', ['Transaction', 'Item', 'Unit', 'Sector'])
  },
}
