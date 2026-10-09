import { test, expect } from './fixtures.ts'

const created: string[] = []

function uniqueLabel() {
  const label = `E2E ${Date.now()}`
  created.push(label)
  return label
}

test.afterEach(async ({ request }) => {
  const response = await request.get('/api/counters')
  const counters: { id: string; label: string }[] = await response.json()

  for (const counter of counters.filter((c) => created.includes(c.label))) {
    await request.delete(`/api/counters/${counter.id}`)
  }
  created.length = 0
})

test('shows the seeded counters from the API', async ({ page }) => {
  await page.goto('/')

  for (const label of ['Ones', 'Threes', 'Fives', 'Tens']) {
    await expect(page.getByRole('group', { name: label })).toBeVisible()
  }
})

test('add a new counter, increment its count, reload', async ({ page }) => {
  const label = uniqueLabel()

  await page.goto('/')
  await page.getByPlaceholder('label').fill(label)
  await page.getByPlaceholder('step').fill('7')
  await page.getByRole('button', { name: 'Add' }).click()

  const card = page.getByRole('group', { name: label })
  await expect(card).toBeVisible()
  await expect(card.getByText('0', { exact: true })).toBeVisible()
  await expect(page.getByPlaceholder('label')).toHaveValue('')
  await card.getByRole('button', { name: `Increment ${label}` }).click()
  await card.getByRole('button', { name: `Increment ${label}` }).click()
  await expect(card.getByText('14', { exact: true })).toBeVisible()
  await page.reload()
  const reloadedCard = page.getByRole('group', { name: label })
  await expect(reloadedCard.getByText('14', { exact: true })).toBeVisible()
})

test('add a new counter, go to its details, delete', async ({ page }) => {
  const label = uniqueLabel()

  await page.goto('/')
  await page.getByPlaceholder('label').fill(label)
  await page.getByPlaceholder('step').fill('7')
  await page.getByRole('button', { name: 'Add' }).click()

  const card = page.getByRole('group', { name: label })
  await expect(card).toBeVisible()
  await card.getByRole('link', { name: label }).click()
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page).toHaveURL('/')
})
