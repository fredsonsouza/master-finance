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
    can('get', 'User')
    can('get', 'Evaluation')
    can('get', 'Category')
    can('manage', 'Category')
    can('manage', 'Sector')
    can('manage', 'Unit')
    can('manage', 'Transaction')
    can('manage', 'Metric')
    can('manage', 'CashClosure')
    can('manage', 'Collection')
    can('manage', 'HrReport')
  },

  FINANCIAL(user, { can }) {
    can('manage', 'Transaction')
    can('manage', 'Metric')
    can('manage', 'CashClosure')
    can('get', 'Item')
    can('get', 'Sector')
    can('get', 'Unit')
    can('get', 'User')
    can('get', 'Category')

    can('create', 'HrReport')
    can('get', 'HrReport', { userId: { $eq: user.id } })
    can('update', 'HrReport', { userId: { $eq: user.id }, status: { $eq: 'DRAFT' } })
    can('delete', 'HrReport', { userId: { $eq: user.id }, status: { $eq: 'DRAFT' } })
  },

  EMPLOYEE(user, { can }) {
    can('get', 'Sector')
    can('get', 'Item')
    can('get', 'Category')
    can('manage', 'Transaction', { unitId: { $eq: user.unitId } })

    can('create', 'HrReport')
    can('get', 'HrReport', { userId: { $eq: user.id } })
    can('update', 'HrReport', { userId: { $eq: user.id }, status: { $eq: 'DRAFT' } })
    can('delete', 'HrReport', { userId: { $eq: user.id }, status: { $eq: 'DRAFT' } })
  },

  SELLER(user, { can }) {
    can('get', 'Sector')
    can('get', 'Item')
    can('get', 'Category')
    can('manage', 'Transaction', { unitId: { $eq: user.unitId } })
    can('get', 'Evaluation', { sellerId: { $eq: user.id } })

    can('create', 'CashClosure')
    can('get', 'CashClosure', { unitId: { $eq: user.unitId } })
    can('update', 'CashClosure', ['cashDate', 'value', 'observation'], {
      userId: { $eq: user.id },
      status: { $eq: 'OPEN' },
    })

    can('create', 'HrReport')
    can('get', 'HrReport', { userId: { $eq: user.id } })
    can('update', 'HrReport', { userId: { $eq: user.id }, status: { $eq: 'DRAFT' } })
    can('delete', 'HrReport', { userId: { $eq: user.id }, status: { $eq: 'DRAFT' } })
  },

  COLLECTOR(user, { can }) {
    can('get', 'Collection', { unitId: { $eq: user.unitId } })

    can('create', 'HrReport')
    can('get', 'HrReport', { userId: { $eq: user.id } })
    can('update', 'HrReport', { userId: { $eq: user.id }, status: { $eq: 'DRAFT' } })
    can('delete', 'HrReport', { userId: { $eq: user.id }, status: { $eq: 'DRAFT' } })
  },

  FISCAL(user, { can }) {
    can('manage', 'Collection')
    can('get', 'User', { unitId: { $eq: user.unitId } })
    can('get', 'Unit')

    can('create', 'HrReport')
    can('get', 'HrReport', { userId: { $eq: user.id } })
    can('update', 'HrReport', { userId: { $eq: user.id }, status: { $eq: 'DRAFT' } })
    can('delete', 'HrReport', { userId: { $eq: user.id }, status: { $eq: 'DRAFT' } })
  },

  INVENTORY(user, { can }) {
    can('manage', 'Transaction')
    can('manage', 'Item')
    can('manage', 'Unit')
    can('manage', 'Sector')
    can('manage', 'Category')

    can('create', 'HrReport')
    can('get', 'HrReport', { userId: { $eq: user.id } })
    can('update', 'HrReport', { userId: { $eq: user.id }, status: { $eq: 'DRAFT' } })
    can('delete', 'HrReport', { userId: { $eq: user.id }, status: { $eq: 'DRAFT' } })
  },

  ANALYST(user, { can }) {
    can('create', 'HrReport')
    can('get', 'HrReport', { userId: { $eq: user.id } })
    can('update', 'HrReport', { userId: { $eq: user.id }, status: { $eq: 'DRAFT' } })
    can('delete', 'HrReport', { userId: { $eq: user.id }, status: { $eq: 'DRAFT' } })
  },
}
