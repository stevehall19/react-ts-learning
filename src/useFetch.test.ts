import { describe, expect, test, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFetch } from './useFetch'
import { isPresets } from './types'

const sevens = { label: 'Sevens', step: 7, start: 0 }

async function settledState(response: Response | Error) {
  const fetchSpy = vi.spyOn(globalThis, 'fetch')
  if (response instanceof Response) {
    fetchSpy.mockResolvedValue(response)
  } else {
    fetchSpy.mockRejectedValue(response)
  }

  const { result } = renderHook(() => useFetch('/presets.json', isPresets))
  expect(fetchSpy).toHaveBeenCalledWith('/presets.json')
  expect(result.current.status).toBe('loading')

  await waitFor(() => expect(result.current.status).not.toBe('loading'))
  return result.current
}

describe('useFetch', () => {
  test('loads and validates data', async () => {
    expect(
      await settledState(
        new Response(JSON.stringify([sevens]), { status: 200 }),
      ),
    ).toEqual({
      status: 'success',
      data: [{ label: 'Sevens', step: 7, start: 0 }],
    })
  })

  test('verify http error', async () => {
    expect(
      await settledState(new Response('Not found', { status: 404 })),
    ).toEqual({ status: 'error', error: 'HTTP 404' })
  })

  test('verify bad data', async () => {
    expect(
      await settledState(
        new Response(JSON.stringify([{ ...sevens, step: '7' }]), {
          status: 200,
        }),
      ),
    ).toEqual({ status: 'error', error: 'unexpected data from /presets.json' })
  })

  test('verify network error', async () => {
    expect(await settledState(new TypeError('Failed to fetch'))).toEqual({
      status: 'error',
      error: 'Failed to fetch',
    })
  })
})
