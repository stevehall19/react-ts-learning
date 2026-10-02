import { describe, test, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCounters } from './useCounters'

describe('useCounters', () => {

    test('starts with the four default counters', () => {
        const { result } = renderHook(() => useCounters())

        expect(result.current.items.map(i => i.label)).toEqual(['Ones', 'Threes', 'Fives', 'Tens'])
    })

    test('test dynamic total', () => {
        const { result } = renderHook(() => useCounters())

        const tens = result.current.items.find(i => i.label === 'Tens')!
        const threes = result.current.items.find(i => i.label === 'Threes')!
        const ones = result.current.items.find(i => i.label === 'Ones')!
        act(() => result.current.increment(tens.id))
        act(() => result.current.increment(threes.id))
        act(() => result.current.increment(ones.id))
        expect(result.current.total).toBe(114)
    })

    test('increment tens', () => {
        const { result } = renderHook(() => useCounters())

        const tens = result.current.items.find(i => i.label === 'Tens')!
        act(() => result.current.increment(tens.id))
        act(() => result.current.increment(tens.id))
        expect(result.current.items.find(i => i.id === tens.id)?.count).toBe(120)
    })

    test('add one', () => {
        const { result } = renderHook(() => useCounters())

        act(() => result.current.add('Big', 10, 100))

        expect(result.current.items.map(i => i.label)).toEqual(['Ones', 'Threes', 'Fives', 'Tens', 'Big'])

    })

    test('remove takes out exactly that counter', () => {
        const { result } = renderHook(() => useCounters())

        const threes = result.current.items.find(i => i.label === 'Threes')!

        act(() => result.current.remove(threes.id))

        expect(result.current.items.map(i => i.label)).toEqual(['Ones', 'Fives', 'Tens'])
    })
})