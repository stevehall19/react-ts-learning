import { describe, expect, test, vi, afterEach } from 'vitest'
import type { CounterItem } from './types'
import {
  createCounter,
  incrementCounter,
  listCounters,
  removeCounter,
  resetCounter,
} from './countersApi'
import type { components } from './api/schema'

const sevens: CounterItem = {
  id: '11111111-1111-1111-1111-111111111111',
  label: 'Sevens',
  step: 7,
  start: 0,
  count: 0,
}

const validationProblem: components['schemas']['ValidationProblem'] = {
  title: 'Bad Request',
  status: 400,
  detail: 'Invalid request content.',
  instance: '/api/counters',
  errors: { step: 'must be greater than or equal to 1' },
}

const conflict: components['schemas']['Problem'] = {
  title: 'Conflict',
  status: 409,
  detail:
    'A request with idempotency key k is already being processed; retry it',
  instance: `/api/counters/${sevens.id}/increment`,
}

const notFound: components['schemas']['Problem'] = {
  title: 'Not Found',
  status: 404,
  detail: `Counter ${sevens.id} not found`,
  instance: `/api/counters/${sevens.id}/increment`,
}

function mockFetch(response: Response) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('countersApi', () => {
  test('listCounters returns the parsed counters', async () => {
    mockFetch(new Response(JSON.stringify([sevens]), { status: 200 }))

    await expect(listCounters()).resolves.toEqual([sevens])
  })

  test('incrementCounter retries a 409 with the same key', async () => {
    vi.useFakeTimers()
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(conflict), { status: 409 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...sevens, count: 7 }), { status: 200 }),
      )

    const result = expect(incrementCounter(sevens.id)).resolves.toEqual({
      ...sevens,
      count: 7,
    })
    await vi.advanceTimersByTimeAsync(1000)
    await result

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    const keys = fetchSpy.mock.calls.map(([, init]) =>
      new Headers(init?.headers).get('Idempotency-Key'),
    )
    expect(keys[0]).toBeTruthy()
    expect(keys[1]).toBe(keys[0])
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

  test('incrementCounter does not retry a 404', async () => {
    const fetchSpy = mockFetch(
      new Response(JSON.stringify(notFound), { status: 404 }),
    )

    await expect(incrementCounter(sevens.id)).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: notFound.detail,
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
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

    await expect(createCounter('Sevens', 7)).resolves.toEqual(sevens)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [path, init] = fetchSpy.mock.calls[0]
    expect(path).toBe('/api/counters')
    expect(init).toEqual(
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ label: 'Sevens', step: 7 }),
      }),
    )
    const headers = new Headers(init?.headers)
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('Idempotency-Key')).toBeTruthy()
  })

  test("createCounter rejects with the server's validation errors", async () => {
    const fetchSpy = mockFetch(
      new Response(JSON.stringify(validationProblem), { status: 400 }),
    )

    await expect(createCounter('Sevens', 0)).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Invalid request content.',
      errors: { step: 'must be greater than or equal to 1' },
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})
