import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import App from './App'

function renderApp() {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  test('opens a counter, then deletes it and returns to the list', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('[]', { status: 200 }),
    )
    renderApp()

    await user.click(screen.getByRole('link', { name: 'Tens' }))

    expect(
      await screen.findByRole('button', { name: '+10' }),
    ).toBeInTheDocument()

    expect(screen.getByText('Tens')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.queryByRole('link', { name: 'Tens' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ones' })).toBeInTheDocument()
  })
})
