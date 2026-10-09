import { test as base } from '@playwright/test'
import { readFileSync } from 'node:fs'

const keycloakUrl = process.env.KEYCLOAK_URL ?? 'http://localhost:8180'

type Realm = {
  users: { username: string; credentials: { type: string; value: string }[] }[]
}

function passwordFor(username: string): string {
  const realm = JSON.parse(
    readFileSync('backend/helm/keycloak/realms/counters-realm.json', 'utf8'),
  ) as Realm
  const user = realm.users.find((u) => u.username === username)
  const password = user?.credentials.find((c) => c.type === 'password')?.value
  if (!password)
    throw new Error(`No password for ${username} in the realm file`)
  return password
}

// Fixture callbacks are usually called `use`; oxlint mistakes that for a React hook.
export const test = base.extend<{ token: string }>({
  // Plain fetch, not playwright.request: Playwright's request contexts pick up extraHTTPHeaders.
  // eslint-disable-next-line no-empty-pattern
  token: async ({}, provide) => {
    const response = await fetch(
      `${keycloakUrl}/realms/counters/protocol/openid-connect/token`,
      {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'counters-e2e',
          username: 'alice',
          password: passwordFor('alice'),
        }),
      },
    )
    if (!response.ok) {
      throw new Error(
        `Keycloak refused the token request: ${response.status} ${await response.text()}`,
      )
    }
    const { access_token } = (await response.json()) as { access_token: string }
    await provide(access_token)
  },

  // Sent with every request from page and request: the app's /api calls go through Vite's proxy with it.
  extraHTTPHeaders: async ({ token }, provide) => {
    await provide({ Authorization: `Bearer ${token}` })
  },
})

export { expect } from '@playwright/test'
