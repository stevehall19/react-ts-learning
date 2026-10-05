import { describe, test, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCounters } from './useCounters'

describe('useCounters', () => {
  test('starts with the four default counters', () => {
    const { result } = renderHook(() => useCounters())

    expect(result.current.items.map((i) => i.label)).toEqual([
      'Ones',
      'Threes',
      'Fives',
      'Tens',
    ])
  })

  test('total adds up all counts', async () => {
    const { result } = renderHook(() => useCounters())

    const tens = result.current.items.find((i) => i.label === 'Tens')!
    const threes = result.current.items.find((i) => i.label === 'Threes')!
    const ones = result.current.items.find((i) => i.label === 'Ones')!
    await act(async () => result.current.increment(tens.id))
    await act(async () => result.current.increment(threes.id))
    await act(async () => result.current.increment(ones.id))
    expect(result.current.total).toBe(114)
  })

  test('increment adds the counters step', async () => {
    const { result } = renderHook(() => useCounters())

    const tens = result.current.items.find((i) => i.label === 'Tens')!
    await act(async () => result.current.increment(tens.id))
    await act(async () => result.current.increment(tens.id))
    expect(result.current.items.find((i) => i.id === tens.id)?.count).toBe(120)
  })

  test('reset returns the count to its starting value', async () => {
    const { result } = renderHook(() => useCounters())

    const tens = result.current.items.find((i) => i.label === 'Tens')!
    await act(async () => result.current.increment(tens.id))
    await act(async () => result.current.increment(tens.id))
    await act(async () => result.current.reset(tens.id))
    expect(result.current.items.find((i) => i.id === tens.id)?.count).toBe(100)
  })

  test('add creates a counter starting at its start value', async () => {
    const { result } = renderHook(() => useCounters())

    await act(async () => result.current.add('Big', 10, 100))

    const big = result.current.items.find((i) => i.label === 'Big')!
    expect(big.count).toBe(100)
    expect(result.current.items.map((i) => i.label)).toEqual([
      'Ones',
      'Threes',
      'Fives',
      'Tens',
      'Big',
    ])
  })

  test('remove takes out exactly that counter', async () => {
    const { result } = renderHook(() => useCounters())

    const threes = result.current.items.find((i) => i.label === 'Threes')!

    await act(async () => result.current.remove(threes.id))

    expect(result.current.items.map((i) => i.label)).toEqual([
      'Ones',
      'Fives',
      'Tens',
    ])
  })
})
