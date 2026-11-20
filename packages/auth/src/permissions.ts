import type { AbilityBuilder } from '@casl/ability'
import type { AppAbility } from '.'
import type { User } from './models/user'
import { hasPermission } from './permission-catalog'
import type { Role } from './roles'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>
) => void

export const permissions: Record<Role, PermissionsByRole> = {
  ADMIN(_, { can }) {
    can('manage', 'all')
  },

  EMPLOYEE(user, { can }) {
    const hasAllUnits = hasPermission(user, 'scope:all_units')

    // Base self-service permissions granted to every active employee
    can('get', 'Department')

    if (hasAllUnits) {
      can('get', 'Unit')
    }

    can('create', 'EmployeeRequest')
    can('get', 'EmployeeRequest', { requestedById: { $eq: user.id } })

    can('create', 'HrReport')
    can('get', 'HrReport', { userId: { $eq: user.id } })
    can('update', 'HrReport', {
      userId: { $eq: user.id },
      status: { $eq: 'DRAFT' },
    })
    can('delete', 'HrReport', {
      userId: { $eq: user.id },
      status: { $eq: 'DRAFT' },
    })

    // Analytics & Dashboard
    if (hasPermission(user, 'dashboard:view')) {
      can('get', 'Metric')
    }

    if (hasPermission(user, 'reports:view')) {
      can('manage', 'Metric')
    }

    // Inventory & Transactions
    if (hasPermission(user, 'transactions:manage')) {
      can('get', 'Sector')
      can('get', 'Item')
      can('get', 'Category')

      if (hasAllUnits) {
        can('manage', 'Transaction')
      } else if (user.unitId) {
        can('manage', 'Transaction', { unitId: { $eq: user.unitId } })
      }
    }

    if (hasPermission(user, 'items:manage')) {
      can('manage', 'Item')
      can('manage', 'Category')
      can('get', 'Sector')
    }

    // Financial (Cash Closures)
    if (hasPermission(user, 'cash_closures:create')) {
      can('create', 'CashClosure')
      if (hasAllUnits) {
        can('get', 'CashClosure')
      } else if (user.unitId) {
        can('get', 'CashClosure', { unitId: { $eq: user.unitId } })
      }
      can('update', 'CashClosure', ['cashDate', 'value', 'observation'], {
        userId: { $eq: user.id },
        status: { $eq: 'OPEN' },
      })
    }

    if (hasPermission(user, 'cash_closures:manage')) {
      can('manage', 'CashClosure')
      can('get', 'User')
      can('get', 'Sector')
      can('get', 'Unit')
    }

    // Operations (Collections)
    if (hasPermission(user, 'collections:execute')) {
      if (hasAllUnits) {
        can('get', 'Collection')
      } else if (user.unitId) {
        can('get', 'Collection', { unitId: { $eq: user.unitId } })
      }
    }

    if (hasPermission(user, 'collections:manage')) {
      can('manage', 'Collection')
      can('get', 'User')
      can('get', 'Unit')
    }

    // Operations (Evaluations)
    if (hasPermission(user, 'evaluations:receive')) {
      can('get', 'Evaluation')
    }

    if (hasPermission(user, 'evaluations:manage')) {
      can('manage', 'Evaluation')
      can('get', 'User')
      can('get', 'Unit')
    }

    // Human Resources
    if (hasPermission(user, 'employees:manage')) {
      can('manage', 'Employee')
      can('manage', 'EmployeeRequest')
      can('manage', 'Department')
      can('get', 'User')
      can('get', 'Unit')
    }

    if (hasPermission(user, 'hr_reports:manage')) {
      can('manage', 'HrReport')
      can('get', 'User')
      can('get', 'Unit')
    }

    // Administration
    if (hasPermission(user, 'users:manage')) {
      can('manage', 'User')
      can('get', 'Department')
      can('get', 'Unit')
    }

    if (hasPermission(user, 'settings:structure')) {
      can('manage', 'Unit')
      can('manage', 'Sector')
      can('manage', 'Category')
      can('manage', 'Department')
    }
  },
}
