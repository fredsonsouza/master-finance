import { defineAbilityFor } from '@saas/auth'
import { describe, expect, test } from 'vitest'

describe('Auth Permissions Test', () => {
  test('EMPLOYEE with items:manage permissions for Item and Category', () => {
    const inventoryUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE' as const,
      unitId: '223e4567-e89b-12d3-a456-426614174001',
      permissions: ['items:manage' as const],
    }

    const ability = defineAbilityFor(inventoryUser)

    expect(ability.can('get', 'Item')).toBe(true)
    expect(ability.can('create', 'Item')).toBe(true)
    expect(ability.can('update', 'Item')).toBe(true)
    expect(ability.can('delete', 'Item')).toBe(true)
    expect(ability.can('manage', 'Item')).toBe(true)

    expect(ability.can('get', 'Category')).toBe(true)
    expect(ability.can('create', 'Category')).toBe(true)
    expect(ability.can('update', 'Category')).toBe(true)
    expect(ability.can('delete', 'Category')).toBe(true)
    expect(ability.can('manage', 'Category')).toBe(true)
  })

  test('EMPLOYEE with settings:structure and transactions:manage permissions', () => {
    const managerUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'EMPLOYEE' as const,
      unitId: '223e4567-e89b-12d3-a456-426614174001',
      permissions: [
        'scope:all_units' as const,
        'transactions:manage' as const,
        'settings:structure' as const,
      ],
    }

    const ability = defineAbilityFor(managerUser)

    expect(ability.can('get', 'Item')).toBe(true)
    expect(ability.can('get', 'Category')).toBe(true)
    expect(ability.can('manage', 'Category')).toBe(true)
    expect(ability.can('manage', 'Department')).toBe(true)
  })
})
