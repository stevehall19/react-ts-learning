import { describe, expect, test, vi } from 'vitest'
import type { CounterItem } from './types'
import {
  createCounter,
  incrementCounter,
  listCounters,
  removeCounter,
  resetCounter,
} from './countersApi'

const sevens: CounterItem = {
  id: '11111111-1111-1111-1111-111111111111',
  label: 'Sevens',
  step: 7,
  start: 0,
  count: 0,
}

const validationProblem = {
  title: 'Bad Request',
  status: 400,
  detail: 'Invalid request content.',
  instance: '/api/counters',
  errors: { step: 'must be greater than or equal to 1' },
}

function mockFetch(response: Response) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)
}

describe('countersApi', () => {
  test('listCounters returns the parsed counters', async () => {
    mockFetch(new Response(JSON.stringify([sevens]), { status: 200 }))

    await expect(listCounters()).resolves.toEqual([sevens])
  })

  test('listCounters returns a 200 but invalid shaped objects', async () => {
    mockFetch(
      new Response(JSON.stringify([{ label: 'Sevens' }]), { status: 200 }),
    )
    await expect(listCounters()).rejects.toThrow('Unexpected response')
  })

  test('incrementCounter increments a counter', async () => {
    mockFetch(
      new Response(JSON.stringify({ ...sevens, count: 7 }), { status: 200 }),
    )

    await expect(incrementCounter(sevens.id)).resolves.toEqual({
      ...sevens,
      count: 7,
    })
  })

  test('resetCounter resets a counter', async () => {
    mockFetch(
      new Response(JSON.stringify({ ...sevens, count: 0 }), { status: 200 }),
    )

    await expect(resetCounter(sevens.id)).resolves.toEqual({
      ...sevens,
      count: 0,
    })
  })

  test('removeCounter sends a DELETE and resolves on 204', async () => {
    const fetchSpy = mockFetch(new Response(null, { status: 204 }))

    await expect(removeCounter(sevens.id)).resolves.toBeUndefined()

    expect(fetchSpy).toHaveBeenCalledWith(
      `/api/counters/${sevens.id}`,
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  test('createCounter sends a JSON POST without start when not given', async () => {
    const fetchSpy = mockFetch(
      new Response(JSON.stringify(sevens), { status: 201 }),
    )

    await createCounter('Sevens', 7)

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/counters',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'Sevens', step: 7 }),
      }),
    )
  })

  test("createCounter rejects with the server's validation errors", async () => {
    mockFetch(new Response(JSON.stringify(validationProblem), { status: 400 }))

    await expect(createCounter('Sevens', 0)).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Invalid request content.',
      errors: { step: 'must be greater than or equal to 1' },
    })
  })
})
