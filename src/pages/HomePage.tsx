import Counter from '../Counter.tsx'
import { useState } from 'react'
import { useLocalStorage } from '../useLocalStorage.ts'
import { useFetch } from '../useFetch.ts'
import { isPresets } from '../types.ts'
import { Button } from '../Button.tsx'
import { Input } from '../Input.tsx'
import { useCountersContext } from '../CountersContext.ts'

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function HomePage() {
  const [label, setLabel] = useState('')
  const [stepText, setStepText] = useState('') // a string: input values are always text
  const [error, setError] = useState<string | null>(null)
  const { items, total, increment, reset, remove, add } = useCountersContext()
  const [title, setTitle] = useLocalStorage('title', 'My counters', isString)
  const presets = useFetch(`${import.meta.env.BASE_URL}presets.json`, isPresets)

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
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold">{title || 'Unknown'}</h1>
        <p className="text-slate-800 dark:text-slate-400">Total: {total}</p>
      </header>

      <div className="flex flex-col gap-2">
        <Input
          placeholder="title"
          value={title}
          className="self-start"
          onChange={(e) => setTitle(e.target.value)}
        />
        {error && <p className="text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="label"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Input
            placeholder="step"
            type="number"
            value={stepText}
            onChange={(e) => setStepText(e.target.value)}
          />

          <Button type="submit" variant="primary">
            Add
          </Button>
        </form>
      </div>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-400">
          Presets
        </h2>
        {presets.status === 'loading' && <p>Loading presets…</p>}
        {presets.status === 'error' && (
          <p className="text-red-600">{presets.error}</p>
        )}
        {presets.status === 'success' && (
          <div className="flex flex-wrap gap-2">
            {presets.data.map((preset) => (
              <Button
                key={preset.label}
                onClick={() => add(preset.label, preset.step, preset.start)}
              >
                + {preset.label}
              </Button>
            ))}
          </div>
        )}
      </section>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Counter
            key={item.id}
            id={item.id}
            label={item.label}
            count={item.count}
            step={item.step}
            onIncrement={() => increment(item.id)}
            onReset={() => reset(item.id)}
            onRemove={() => remove(item.id)}
          />
        ))}
      </div>
    </main>
  )
}

export default HomePage
