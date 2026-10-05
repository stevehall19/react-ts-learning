import type { components } from './api/schema'
import { type CounterItem, isCounterItem, isCounterItems } from './types'

type ValidationErrors = components['schemas']['ValidationProblem']['errors']

export class ApiError extends Error {
  status: number
  errors: ValidationErrors | undefined

  constructor(status: number, message: string, errors?: ValidationErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, init)

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    if (isProblem(body)) {
      throw new ApiError(response.status, body.detail, body.errors)
    }
    throw new ApiError(response.status, `HTTP ${response.status}`)
  }

  if (response.status === 204) return undefined
  return response.json()
}

export async function listCounters(): Promise<CounterItem[]> {
  const data = await request('/api/counters')
  if (!isCounterItems(data))
    throw new Error('Unexpected response from GET /api/counters')
  return data
}

export async function findCounter(id: string): Promise<CounterItem> {
  const data = await request('/api/counters/' + id)
  if (!isCounterItem(data))
    throw new Error('Unexpected response from GET /api/counters/' + id)
  return data
}

export async function incrementCounter(id: string): Promise<CounterItem> {
  const data = await request(`/api/counters/${id}/increment`, {
    method: 'POST',
  })
  if (!isCounterItem(data))
    throw new Error(
      'Unexpected response from POST /api/counters/' + id + '/increment',
    )
  return data
}

export async function resetCounter(id: string): Promise<CounterItem> {
  const data = await request(`/api/counters/${id}/reset`, {
    method: 'POST',
  })
  if (!isCounterItem(data))
    throw new Error(
      'Unexpected response from POST /api/counters/' + id + '/reset',
    )
  return data
}

export async function removeCounter(id: string): Promise<void> {
  await request(`/api/counters/${id}`, { method: 'DELETE' })
}

export async function createCounter(
  label: string,
  step: number,
  start?: number,
): Promise<CounterItem> {
  const body: components['schemas']['CreateCounterRequest'] = {
    label,
    step,
    start,
  }
  const data = await request('/api/counters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!isCounterItem(data))
    throw new Error('Unexpected response from POST /api/counters')
  return data
}

function isProblem(
  value: unknown,
): value is { detail: string; errors?: ValidationErrors } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'detail' in value &&
    typeof value.detail === 'string'
  )
}
