import Counter from './Counter'
import { useState } from 'react'
import { useCounters } from './useCounters'
import { useLocalStorage } from './useLocalStorage'
import { useFetch } from './useFetch'
import { isPresets } from './types'
import { Button } from './Button'

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
    <main className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">{title || 'Unknown'}</h1>
        <p className="text-gray-800">Total: {total}</p>
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

            <Button type="submit" className="counter">
              Add
            </Button>
          </form>
        </div>
      </div>
      {presets.status === 'loading' && <p>Loading presets…</p>}
      {presets.status === 'error' && <p className="error">{presets.error}</p>}
      {presets.status === 'success' && (
        <div>
          {presets.data.map((preset) => (
            <Button
              type="button"
              key={preset.label}
              onClick={() => add(preset.label, preset.step, preset.start)}
            >
              + {preset.label}
            </Button>
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
    </main>
  )
}

export default App
