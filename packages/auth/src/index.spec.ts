import { describe, expect, test } from 'vitest'
import {
  canGrantAccess,
  defineAbilityFor,
  getDefaultHomeRoute,
  hasAnyPermission,
  hasPermission,
} from './index'

describe('PBAC Auth Permissions Test', () => {
  const unitA = '223e4567-e89b-12d3-a456-426614174001'
  const unitB = '223e4567-e89b-12d3-a456-426614174002'
  const userId = '123e4567-e89b-12d3-a456-426614174000'

  test('ADMIN role has unrestricted access to everything', () => {
    const admin = {
      id: userId,
      role: 'ADMIN' as const,
      unitId: null,
      permissions: [],
    }

    const ability = defineAbilityFor(admin)

    expect(ability.can('manage', 'all')).toBe(true)
    expect(ability.can('manage', 'User')).toBe(true)
    expect(ability.can('manage', 'Department')).toBe(true)
    expect(ability.can('manage', 'Sector')).toBe(true)
    expect(hasPermission(admin, 'logs:view')).toBe(true)
    expect(hasPermission(admin, 'scope:all_units')).toBe(true)
    expect(getDefaultHomeRoute(admin)).toBe('/')
  })

  test('Basic EMPLOYEE (no checkboxes) only has self-service permissions', () => {
    const basicEmployee = {
      id: userId,
      role: 'EMPLOYEE' as const,
      unitId: unitA,
      permissions: [],
    }

    const ability = defineAbilityFor(basicEmployee)

    // Own HrReport & EmployeeRequest allowed
    expect(ability.can('create', 'HrReport')).toBe(true)
    expect(
      ability.can('get', {
        __typename: 'HrReport',
        id: '1',
        userId,
      } as any)
    ).toBe(true)
    expect(
      ability.can('get', {
        __typename: 'HrReport',
        id: '2',
        userId: 'other-user',
      } as any)
    ).toBe(false)

    expect(ability.can('create', 'EmployeeRequest')).toBe(true)
    expect(
      ability.can('get', {
        __typename: 'EmployeeRequest',
        id: 'req-1',
        requestedById: userId,
      } as any)
    ).toBe(true)
    expect(
      ability.can('get', {
        __typename: 'EmployeeRequest',
        id: 'req-2',
        requestedById: 'other-user',
      } as any)
    ).toBe(false)

    // Read-only lookups
    expect(ability.can('get', 'Unit')).toBe(false)
    expect(ability.can('get', 'Department')).toBe(true)

    // Operational modules denied
    expect(ability.can('get', 'Item')).toBe(false)
    expect(ability.can('get', 'Transaction')).toBe(false)
    expect(ability.can('get', 'CashClosure')).toBe(false)
    expect(ability.can('get', 'Collection')).toBe(false)
    expect(ability.can('get', 'Evaluation')).toBe(false)
    expect(ability.can('get', 'Employee')).toBe(false)
    expect(ability.can('get', 'User')).toBe(false)
    expect(getDefaultHomeRoute(basicEmployee)).toBe('/employees/requests')
  })

  test('Unit-scoped inventory employee can only manage transactions of their own unit', () => {
    const unitInventory = {
      id: userId,
      role: 'EMPLOYEE' as const,
      unitId: unitA,
      permissions: ['transactions:manage' as const],
    }

    const ability = defineAbilityFor(unitInventory)

    expect(ability.can('get', 'Item')).toBe(true)
    expect(ability.can('create', 'Item')).toBe(false)
    expect(ability.can('get', 'Sector')).toBe(true)
    expect(ability.can('manage', 'Sector')).toBe(false)

    expect(
      ability.can('manage', {
        __typename: 'Transaction',
        id: 'tx-1',
        unitId: unitA,
      } as any)
    ).toBe(true)

    expect(
      ability.can('manage', {
        __typename: 'Transaction',
        id: 'tx-2',
        unitId: unitB,
      } as any)
    ).toBe(false)

    expect(getDefaultHomeRoute(unitInventory)).toBe('/transactions')
  })

  test('Global inventory employee with scope:all_units and items:manage can manage any unit', () => {
    const globalInventory = {
      id: userId,
      role: 'EMPLOYEE' as const,
      unitId: unitA,
      permissions: [
        'scope:all_units' as const,
        'transactions:manage' as const,
        'items:manage' as const,
        'settings:structure' as const,
      ],
    }

    const ability = defineAbilityFor(globalInventory)

    expect(
      ability.can('manage', {
        __typename: 'Transaction',
        id: 'tx-2',
        unitId: unitB,
      } as any)
    ).toBe(true)
    expect(ability.can('manage', 'Item')).toBe(true)
    expect(ability.can('manage', 'Category')).toBe(true)
    expect(ability.can('manage', 'Sector')).toBe(true)
    expect(ability.can('manage', 'Unit')).toBe(true)
  })

  test('Receptionist permissions: cash closures scoped to unit and evaluations receive', () => {
    const receptionist = {
      id: userId,
      role: 'EMPLOYEE' as const,
      unitId: unitA,
      permissions: [
        'cash_closures:create' as const,
        'evaluations:receive' as const,
      ],
    }

    const ability = defineAbilityFor(receptionist)

    expect(ability.can('create', 'CashClosure')).toBe(true)
    expect(
      ability.can('get', {
        __typename: 'CashClosure',
        id: 'cc-1',
        unitId: unitA,
      } as any)
    ).toBe(true)
    expect(
      ability.can('get', {
        __typename: 'CashClosure',
        id: 'cc-2',
        unitId: unitB,
      } as any)
    ).toBe(false)
    // evaluations:receive alone does NOT grant viewing evaluations
    expect(ability.can('get', 'Evaluation')).toBe(false)
    expect(ability.can('delete', 'Evaluation')).toBe(false)
    expect(ability.can('get', 'Transaction')).toBe(false)
    expect(getDefaultHomeRoute(receptionist)).toBe('/cash-closures')

    // evaluations:view_own explicitly grants viewing own evaluations (read-only)
    const viewer = {
      id: userId,
      role: 'EMPLOYEE' as const,
      unitId: unitA,
      permissions: [
        'evaluations:receive' as const,
        'evaluations:view_own' as const,
      ],
    }
    const viewerAbility = defineAbilityFor(viewer)
    expect(viewerAbility.can('get', 'Evaluation')).toBe(true)
    expect(viewerAbility.can('delete', 'Evaluation')).toBe(false)
    expect(getDefaultHomeRoute(viewer)).toBe('/evaluations')
  })

  test('HR employee can manage Employees, Departments, Requests, Users, and Evaluations without managing Inventory Sectors', () => {
    const hrUser = {
      id: userId,
      role: 'EMPLOYEE' as const,
      unitId: unitA,
      permissions: [
        'scope:all_units' as const,
        'dashboard:view' as const,
        'employees:manage' as const,
        'hr_reports:manage' as const,
        'evaluations:manage' as const,
        'users:manage' as const,
      ],
    }

    const ability = defineAbilityFor(hrUser)

    expect(ability.can('manage', 'Employee')).toBe(true)
    expect(ability.can('manage', 'EmployeeRequest')).toBe(true)
    expect(ability.can('manage', 'Department')).toBe(true)
    expect(ability.can('manage', 'HrReport')).toBe(true)
    expect(ability.can('manage', 'Evaluation')).toBe(true)
    expect(ability.can('manage', 'User')).toBe(true)
    expect(ability.can('get', 'Metric')).toBe(true)

    // Cannot manage inventory sectors or units without settings:structure
    expect(ability.can('manage', 'Sector')).toBe(false)
    expect(ability.can('manage', 'Unit')).toBe(false)
    expect(ability.can('manage', 'Category')).toBe(false)
    expect(hasAnyPermission(hrUser, ['employees:manage', 'logs:view'])).toBe(
      true
    )
  })

  test('canGrantAccess prevents privilege escalation while allowing HR onboarding', () => {
    const hrActor = {
      role: 'EMPLOYEE' as const,
      permissions: ['employees:manage' as const, 'users:manage' as const],
    }

    // HR CAN onboard a receptionist with operational permissions
    expect(
      canGrantAccess(hrActor, 'EMPLOYEE', [
        'cash_closures:create',
        'evaluations:receive',
      ])
    ).toEqual({ allowed: true })

    // HR CANNOT promote anyone to ADMIN
    expect(canGrantAccess(hrActor, 'ADMIN', []).allowed).toBe(false)

    // HR CANNOT grant privileged admin permissions it does not have (logs:view / settings:structure)
    expect(canGrantAccess(hrActor, 'EMPLOYEE', ['logs:view']).allowed).toBe(
      false
    )
    expect(
      canGrantAccess(hrActor, 'EMPLOYEE', ['settings:structure']).allowed
    ).toBe(false)

    // ADMIN can grant anything
    const adminActor = { role: 'ADMIN' as const, permissions: [] }
    expect(
      canGrantAccess(adminActor, 'ADMIN', ['logs:view', 'settings:structure'])
    ).toEqual({ allowed: true })
  })
})
