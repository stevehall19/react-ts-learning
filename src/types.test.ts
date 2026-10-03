import { describe, test, expect } from 'vitest'
import { isCounterItem } from './types'

describe('isCounterItem', () => {
  const valid = { id: 'a', label: 'X', step: 1, start: 0, count: 0 }

  test('accepts a valid item', () => {
    expect(isCounterItem(valid)).toBe(true)
  })

  test('rejects a null', () => {
    expect(isCounterItem(null)).toBe(false)
  })

  test('rejects a string', () => {
    expect(isCounterItem('a string')).toBe(false)
  })

  test('rejects an empty object', () => {
    expect(isCounterItem({})).toBe(false)
  })

  test('rejects a negative step', () => {
    expect(isCounterItem({ ...valid, step: -1 })).toBe(false)
  })

  test.each(['step', 'start', 'count'])('rejects a string %s', (field) => {
    expect(isCounterItem({ ...valid, [field]: '5' })).toBe(false)
  })

  test.each(['id', 'label'])('rejects a number %s', (field) => {
    expect(isCounterItem({ ...valid, [field]: 4 })).toBe(false)
  })
})
