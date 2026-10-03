import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const sevens = { label: 'Sevens', step: 7, start: 0 }

describe('App', () => {
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
    render(<App />)

    expect(
      await screen.findByRole('button', { name: '+ Sevens' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '+ Sevens' }))

    expect(
      screen.getByRole('button', { name: /Sevens is 0/ }),
    ).toBeInTheDocument()
  })

  test('clicking a counter increments it', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Ones is 0/ }))

    expect(
      screen.getByRole('button', { name: /Ones is 1/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('Total: 101'))
  })

  test('adding a counter', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText('label'), 'Sevens')
    await user.type(screen.getByPlaceholderText('step'), '7')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await user.click(screen.getByRole('button', { name: /Sevens is 0/ }))

    expect(
      screen.getByRole('button', { name: /Sevens is 7/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('Total: 107'))
    expect(screen.getByPlaceholderText('label')).toHaveValue('')
    expect(screen.getByPlaceholderText('step')).toHaveValue(null)
  })

  test('rejects a zero step and keeps the input', async () => {
    const user = userEvent.setup()
    render(<App />)

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
