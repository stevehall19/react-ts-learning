import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomePage from './HomePage.tsx'
import { MemoryRouter } from 'react-router'
import { CountersProvider } from './CountersContext.tsx'

const sevens = { label: 'Sevens', step: 7, start: 0 }

function renderHomePage() {
  render(
    <MemoryRouter>
      <CountersProvider>
        <HomePage />
      </CountersProvider>
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('[]', { status: 200 }),
    )
  })

  test('adds a counter from a fetched preset', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([sevens]), { status: 200 }),
    )
    renderHomePage()

    expect(
      await screen.findByRole('button', { name: '+ Sevens' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '+ Sevens' }))

    expect(
      screen.getByRole('button', { name: /Increment Sevens/ }),
    ).toBeInTheDocument()
  })

  test('clicking a counter increments it', async () => {
    const user = userEvent.setup()
    renderHomePage()

    await user.click(screen.getByRole('button', { name: /Increment Ones/ }))

    const onesCard = screen.getByRole('group', { name: 'Ones' })
    expect(within(onesCard).getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Total: 101'))
  })

  test('adding a counter', async () => {
    const user = userEvent.setup()
    renderHomePage()

    await user.type(screen.getByPlaceholderText('label'), 'Sevens')
    await user.type(screen.getByPlaceholderText('step'), '7')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await user.click(screen.getByRole('button', { name: /Increment Sevens/ }))

    const sevensCard = screen.getByRole('group', { name: 'Sevens' })
    expect(within(sevensCard).getByText('7')).toBeInTheDocument()
    expect(screen.getByText('Total: 107'))
    expect(screen.getByPlaceholderText('label')).toHaveValue('')
    expect(screen.getByPlaceholderText('step')).toHaveValue(null)
  })

  test('rejects a zero step and keeps the input', async () => {
    const user = userEvent.setup()
    renderHomePage()

    await user.type(screen.getByPlaceholderText('label'), 'Zero')
    await user.type(screen.getByPlaceholderText('step'), '0')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.queryByText('Zero is 0')).toBeNull()

    expect(
      screen.getByText('Step must be a whole number above 0'),
    ).toBeInTheDocument()
    expect(screen.getByText('Total: 100'))
  })
})
