import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import Counter from './Counter'
import { useState } from 'react'
import { useCounters } from './useCounters'
import { useLocalStorage } from './useLocalStorage'
import { useFetch } from './useFetch'
import { isPresets } from './types'

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function App() {
  const [label, setLabel] = useState('')
  const [stepText, setStepText] = useState('') // a string: input values are always text
  const [error, setError] = useState<string | null>(null)
  const { items, total, increment, reset, remove, add } = useCounters()
  const [title, setTitle] = useLocalStorage('title', 'My counters', isString)
  const presets = useFetch('/presets.json', isPresets)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const step = Number(stepText)
    if (!Number.isInteger(step) || step <= 0) {
      setError('Step must be a whole number above 0')
      return
    }
    if (label.trim() === '') {
      setError('Label is required')
      return
    }

    add(label.trim(), step)
    setLabel('')
    setStepText('')
    setError(null)
  }

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>{title || 'Unknown'}</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
          <p>Total: {total}</p>
          <div>
            <input
              placeholder="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
              <input
                placeholder="label"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <input
                placeholder="step"
                type="number"
                value={stepText}
                onChange={(e) => setStepText(e.target.value)}
              />

              <button type="submit" className="counter">
                Add
              </button>
            </form>
          </div>
        </div>
        {presets.status === 'loading' && <p>Loading presets…</p>}
        {presets.status === 'error' && <p className="error">{presets.error}</p>}
        {presets.status === 'success' && (
          <div>
            {presets.data.map((preset) => (
              <button
                type="button"
                className="counter"
                key={preset.label}
                onClick={() => add(preset.label, preset.step, preset.start)}
              >
                + {preset.label}
              </button>
            ))}
          </div>
        )}
        <div>
          {items.map((item) => (
            <Counter
              key={item.id}
              label={item.label}
              count={item.count}
              onIncrement={() => increment(item.id)}
              onReset={() => reset(item.id)}
              onRemove={() => remove(item.id)}
            />
          ))}
        </div>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
