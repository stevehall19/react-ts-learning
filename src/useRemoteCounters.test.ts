import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useRemoteCounters } from './useRemoteCounters'
import {
  ApiError,
  createCounter,
  incrementCounter,
  listCounters,
  removeCounter,
  resetCounter,
} from './countersApi'
import type { CounterItem } from './types'

vi.mock(import('./countersApi'), async (importOriginal) => ({
  ...(await importOriginal()),
  listCounters: vi.fn(),
  createCounter: vi.fn(),
  incrementCounter: vi.fn(),
  resetCounter: vi.fn(),
  removeCounter: vi.fn(),
}))

async function loadedHook(items: CounterItem[]) {
  vi.mocked(listCounters).mockResolvedValue(items)
  const { result } = renderHook(() => useRemoteCounters())
  await waitFor(() => expect(result.current.status).toBe('ready'))
  return result
}

const ones: CounterItem = {
  id: 'id-ones',
  label: 'Ones',
  step: 1,
  start: 0,
  count: 0,
}
const tens: CounterItem = {
  id: 'id-tens',
  label: 'Tens',
  step: 10,
  start: 100,
  count: 100,
}

const elevens: CounterItem = {
  id: 'id-elevens',
  label: 'Elevens',
  step: 11,
  start: 0,
  count: 0,
}

describe('useRemoteCounters', () => {
  beforeEach(() => vi.resetAllMocks())

  test('loads the counters the API returns', async () => {
    vi.mocked(listCounters).mockResolvedValue([ones, tens])

    const { result } = renderHook(() => useRemoteCounters())
    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.items).toEqual([ones, tens])
    expect(result.current.total).toBe(100)
  })

  test('loading the counters fails', async () => {
    vi.mocked(listCounters).mockRejectedValue(new Error('an error message'))
    const { result } = renderHook(() => useRemoteCounters())
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('an error message')
  })

  test('increments a counter', async () => {
    const result = await loadedHook([ones, tens])
    vi.mocked(incrementCounter).mockResolvedValue({ ...tens, count: 110 })

    await act(async () => result.current.increment(tens.id))
    expect(incrementCounter).toHaveBeenCalledWith(tens.id)
    expect(result.current.items).toEqual([ones, { ...tens, count: 110 }])
    expect(result.current.total).toBe(110)
  })

  test('a failed increment rejects and leaves the counters unchanged', async () => {
    const result = await loadedHook([ones, tens])
    vi.mocked(incrementCounter).mockRejectedValue(
      new ApiError(404, `Counter ${tens.id} not found`),
    )

    await act(async () => {
      await expect(result.current.increment(tens.id)).rejects.toThrow(
        'not found',
      )
    })

    expect(result.current.items).toEqual([ones, tens])
    expect(result.current.error).toBeNull()
  })

  test('resets a counter', async () => {
    const result = await loadedHook([ones, { ...tens, count: 130 }])
    vi.mocked(resetCounter).mockResolvedValue(tens)

    await act(async () => result.current.reset(tens.id))
    expect(resetCounter).toHaveBeenCalledWith(tens.id)
    expect(result.current.items).toEqual([ones, { ...tens, count: 100 }])
    expect(result.current.total).toBe(100)
  })

  test('remove a counter', async () => {
    const result = await loadedHook([ones, tens])
    vi.mocked(removeCounter).mockResolvedValue(undefined)

    await act(async () => result.current.remove(tens.id))
    expect(removeCounter).toHaveBeenCalledWith(tens.id)
    expect(result.current.items).toEqual([ones])
  })

  test('add a counter', async () => {
    const result = await loadedHook([ones, tens])
    vi.mocked(createCounter).mockResolvedValue(elevens)

    await act(async () => result.current.add('Elevens', 11, 0))
    expect(createCounter).toHaveBeenCalledWith('Elevens', 11, 0)
    expect(result.current.items).toEqual([ones, tens, elevens])
  })
})
