import { describe, expect, test } from 'vitest'
import { defineAbilityFor } from './index'

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

  test('ANALYST role permissions for HrReport only', () => {
    const analystUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ANALYST' as const,
      unitId: '223e4567-e89b-12d3-a456-426614174001',
    }

    const ability = defineAbilityFor(analystUser as any)

    expect(ability.can('create', 'HrReport')).toBe(true)
    expect(
      ability.can('get', {
        __typename: 'HrReport',
        id: '1',
        userId: '123e4567-e89b-12d3-a456-426614174000',
      } as any)
    ).toBe(true)
    expect(
      ability.can('get', {
        __typename: 'HrReport',
        id: '2',
        userId: 'other-user-id',
      } as any)
    ).toBe(false)

    expect(ability.can('get', 'Item')).toBe(false)
    expect(ability.can('get', 'Transaction')).toBe(false)
    expect(ability.can('get', 'CashClosure')).toBe(false)
    expect(ability.can('get', 'Collection')).toBe(false)
  })
})
