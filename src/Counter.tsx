import { Button } from './Button'
import { Link } from 'react-router'

type CounterProps = {
  id: string
  label: string
  count: number // the parent now owns this value
  step: number
  onIncrement: () => void // a function with no arguments that returns nothing
  onReset: () => void
  onRemove: () => void
}

function Counter({
  id,
  label,
  step,
  count,
  onIncrement,
  onReset,
  onRemove,
}: CounterProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800"
    >
      <div className="my-2 text-2xl font-bold">
        <Link to={`/counters/${id}`} className="hover:underline">
          {label}
        </Link>
      </div>

      <div className="my-2 text-4xl font-bold">{count}</div>
      <div className="flex items-center justify-between">
        <Button type="button" onClick={() => onReset()}>
          Reset
        </Button>
        <Button aria-label={`Increment ${label}`} onClick={onIncrement}>
          +{step}
        </Button>
        <Button
          variant="danger"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
        >
          ✕
        </Button>
      </div>
    </div>
  )
}

export default Counter
