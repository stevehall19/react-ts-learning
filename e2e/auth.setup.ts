import { test as setup, expect } from '@playwright/test'
import { passwordFor } from './fixtures.ts'

export const aliceState = 'playwright/.auth/alice.json'

// Signs in once through Keycloak's real login page and saves the browser state. The
// state holds Keycloak's session cookie (the app keeps its tokens in memory), so each
// test's page bounces through Keycloak and comes back signed in without the form.
setup('sign in as alice', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Username or email').fill('alice')
  await page.getByLabel('Password', { exact: true }).fill(passwordFor('alice'))
  await page.getByRole('button', { name: 'Sign In' }).click()

  await expect(page).toHaveURL('/')
  // Layout only renders the page once the counters have loaded with the new token.
  await expect(page.getByRole('button', { name: 'Add' })).toBeVisible()

  await page.context().storageState({ path: aliceState })
})
