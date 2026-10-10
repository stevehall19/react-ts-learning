import type { components } from './api/schema'
import { type CounterItem, isCounterItem, isCounterItems } from './types'
import { userManager } from './auth'

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

function addHeaderToInit(
  init: RequestInit | undefined,
  key: string,
  value: string,
): RequestInit {
  const headers = new Headers(init?.headers)
  headers.set(key, value)
  return {
    ...init,
    headers,
  }
}

async function requestWithRetry(
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  const maxAttempts = 3
  const delayIncrement = 200
  const key = crypto.randomUUID()

  const keyedInit = addHeaderToInit(init, 'Idempotency-Key', key)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await request(path, keyedInit)
    } catch (e) {
      const retryable =
        e instanceof TypeError ||
        (e instanceof ApiError && [409, 502, 503, 504].includes(e.status))
      if (!retryable || attempt === maxAttempts - 1) throw e
    }

    await new Promise((resolve) =>
      setTimeout(resolve, delayIncrement * attempt + 1),
    )
  }
  throw new Error(`Request failed after three retries.`)
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const user = await userManager?.getUser()
  const authorizedInit = user?.access_token
    ? addHeaderToInit(init, 'Authorization', `Bearer ${user.access_token}`)
    : init
  const response = await fetch(path, authorizedInit)

  // A 401 with no token, or an expired one that couldn't be renewed (Keycloak's
  // session ended): sign in again. Not awaited: the promise only settles if the user
  // comes back to this page. A 401 for a token that hasn't expired means the API
  // rejects it, so redirecting would loop; that one is just reported.
  if (response.status === 401 && userManager && (!user || user.expired)) {
    void userManager.signinRedirect()
  }

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
  const data = await requestWithRetry(`/api/counters/${id}/increment`, {
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
  const data = await requestWithRetry('/api/counters', {
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
