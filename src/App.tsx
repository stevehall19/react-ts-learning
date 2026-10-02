import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import Counter from "./Counter";
import {useState} from "react";

type CounterItem = {
  id: string
  label: string
  step: number
  start: number
  count: number
}

const initialItems: CounterItem[] = [
    { id: crypto.randomUUID(), label: 'Ones', step: 1, start: 0, count: 0 },
    { id: crypto.randomUUID(), label: 'Threes', step: 3, start: 0, count: 0 },
    { id: crypto.randomUUID(), label: 'Fives', step: 5, start: 0, count: 0 },
    { id: crypto.randomUUID(), label: 'Tens', step: 10, start: 100, count: 100 },
]

function App() {
  const [items, setItems] = useState<CounterItem[]>(initialItems)
  const [label, setLabel] = useState('')
  const [stepText, setStepText] = useState('')   // a string: input values are always text
  const [error, setError] = useState<string | null>(null)
  const total = items.reduce((sum, item) => sum + item.count, 0)

  function increment(id: string) {
    setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, count: item.count + item.step } : item))
    )
  }

  function reset(id: string) {
    setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, count: item.start} : item))
    )
  }

  function remove(id: string) {
    setItems(prev =>
        prev.filter(item => item.id !== id)
    )
  }

  function add(newItem: CounterItem) {
    setItems(prev => [...prev, newItem])
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const step = Number(stepText)
    if (!Number.isInteger(step) || step <= 0) {
      setError('Step must be a whole number above 0')
      return;
    }
    if (label.trim() === '') {
      setError('Label is required')
      return;
    }
    const item: CounterItem = {
      id: crypto.randomUUID(),
      label: label.trim(),
      step: step,
      start: 0,
      count: 0,
    }
    add(item);
    setLabel('')
    setStepText('')
    setError(null);
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
          <h1>something of your own</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
          <p>
            Total: {total}
          </p>
          <div>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
              <input placeholder="label" required value={label} onChange={e => setLabel(e.target.value)} />
              <input placeholder="step"  type='number' value={stepText} onChange={e => setStepText(e.target.value)} />
              <button
                  type="submit"
                  className="counter">
                Add
              </button>
            </form>
          </div>
        </div>

        <div>

          {items.map(item => <Counter key={item.id}
                                             label={item.label}
                                             count={item.count}
                                             onIncrement={ () => increment(item.id)}
                                             onReset={ () => reset(item.id)}
                                             onRemove={() => remove(item.id)}/>)}
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
