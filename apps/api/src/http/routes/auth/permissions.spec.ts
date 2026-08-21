import { defineAbilityFor } from '@saas/auth'
import { describe, expect, test } from 'vitest'

describe('Auth Permissions Test', () => {
  test('INVENTORY role permissions for Item and Category', () => {
    const inventoryUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'INVENTORY' as const,
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    }

    const ability = defineAbilityFor(inventoryUser as any)

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

  test('MANAGER role permissions for Item and Category', () => {
    const managerUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'MANAGER' as const,
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    }

    const ability = defineAbilityFor(managerUser as any)

    expect(ability.can('get', 'Item')).toBe(true)
    expect(ability.can('get', 'Category')).toBe(true)
    expect(ability.can('manage', 'Category')).toBe(true)
  })
})
